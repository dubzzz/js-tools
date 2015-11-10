Array.prototype.sortOnBestScore = function() {
	this.sort(function(a, b){
		if(a['autocomplete_score'] < b['autocomplete_score']){
			return -1;
		} else if(a['autocomplete_score'] > b['autocomplete_score']) {
			return 1;
		} else if (a['autocomplete_rawdata_on'] < b['autocomplete_rawdata_on']) {
			return -1;
		} else if (a['autocomplete_rawdata_on'] > b['autocomplete_rawdata_on']) {
			return 1;
		}
		return 0;
	});
}

function toSafeHtml(text) {
	return $("<a/>").text(text).html();
}

function AutocompleteItem($input, available_elts) {
	var self = this;

	// jQuery element corresponding to a text input
	// This text input will benefit from autocompletion feature
	self.$input = $input;

	// A list of available elements that can be displayed to the end-user
	// Each element should have the fields:
	// - autocomplete_id
	// - autocomplete_rawdata_on: text to display during completion
	self.available_elts = available_elts;
	
	// Update available elements available
	self.updateList = function(available_elts) {
		self.available_elts = available_elts;
	};

	// Callback called when selecting an element from the autocomplete-list
	// Paramaters are: function($input, selected_elt)
	// - $input: the input linked to this object ie. self.$input
	// - selected_elt: an element from self.available_elts (self.available_elts[i])
	self.onSelectCallback = undefined;
	self.setOnSelectCallback = function(callback) {
		self.onSelectCallback = callback;
	};

	// Callback called during the creation of the autocomplete-list
	// Parameters are: function($input, elt)
	// - $input: the input linked to this object ie. self.$input
	// - elt: an element from self.available_elts (self.available_elts[i])
	// Return:
	// - false: the element can be added to the list
	self.onFilterChoicesCallback = undefined;
	self.setOnFilterChoicesCallback = function(callback) {
		self.onFilterChoicesCallback = callback;
	};

	// Boolean to specify whether or not the field should be freed
	// after each selection
	self.automaticallyEraseValue = true;
	self.setAutomaticallyEraseValue = function(automaticallyEraseValue) {
		self.automaticallyEraseValue = automaticallyEraseValue;
	};

	// THe maximum number of results expected
	self.numMaxResults = -1;
	self.setNumMaxResults = function(numMaxResults) {
		self.numMaxResults = numMaxResults;
	};

	// Behaviour on 'key up' event
	// Update autocomplete list
	self.reactKeyUp = function(event) {
		// Refresh the content of the autocomplete list
		// $(this) == self.jquery_input

		// Get autocomplete list or create it if not displayed
		var $input_parent = $(this).parent();
		var $autocomplete_list = $input_parent.find(".autocomplete-list");
		if ($autocomplete_list.length == 0) {
			$autocomplete_list = $("<ul/>");
			$autocomplete_list.addClass("autocomplete-list");
			$input_parent.append($autocomplete_list);
		}

		// Show the autocomplete list at the right place
		var position_left = $(this).position()['left'];
		var position_top = $(this).position()['top'] + $(this).height();
		$autocomplete_list.css('left', position_left + 'px');
		$autocomplete_list.css('top', position_top + 'px');
		
		// Get already selected elements position
		var $selected_elt = $autocomplete_list.find('.autocomplete-list-selected').first();
		var selected_elt_id = -1;
		if ($selected_elt.length == 1) {
			selected_elt_id = parseInt($selected_elt.attr('data-autocomplete-id'));
		}
		if (selected_elt_id != -1 && event.keyCode == 13) { // Enter
			self.confirmChoice(selected_elt_id);
			if (self.automaticallyEraseValue) {
				$(this).val("");
			}
			$autocomplete_list.remove();
			event.preventDefault();
			return;
		}
		else if (event.keyCode == 38 || event.keyCode == 40) { // Up or Down
			var $autocomplete_elts = $autocomplete_list.children();
			var current_index = 0;
			for (current_index=0 ; current_index != $autocomplete_elts.length ; current_index++) {
				if ($($autocomplete_elts[current_index]).hasClass('autocomplete-list-selected')) {
					break;
				}
			}
			if ($autocomplete_elts.length > 0) {
				if (current_index == $autocomplete_elts.length) {
					$($autocomplete_elts[0]).addClass('autocomplete-list-selected');
				} else if (event.keyCode == 38) {
					if (current_index > 0) {
						$($autocomplete_elts[current_index]).removeClass('autocomplete-list-selected');
						$($autocomplete_elts[current_index -1]).addClass('autocomplete-list-selected');
					}
				} else if (event.keyCode == 40) {
					if (current_index < $autocomplete_elts.length -1) {
						$($autocomplete_elts[current_index]).removeClass('autocomplete-list-selected');
						$($autocomplete_elts[current_index +1]).addClass('autocomplete-list-selected');
					}
				}
				event.preventDefault();
				return;
			}
		} else if (event.keyCode == 27) {
			$autocomplete_list.remove();
		}
		
		// Create autocomplete list
		var elts_to_display = self.computeChoices($(this).val());
		
		// Display elements
		$autocomplete_list.empty();
		for (var i=0 ; i != elts_to_display.length ; i++) {
			var $autocomplete_elt = $("<li/>");
			$autocomplete_elt.attr('data-autocomplete-id', elts_to_display[i]['autocomplete_id']);
			if (elts_to_display[i]['autocomplete_id'] == selected_elt_id) {
				$autocomplete_elt.addClass('autocomplete-list-selected');
			}
			$autocomplete_elt.click(function() {
				self.confirmChoice($(this).attr("data-autocomplete-id"));
				if (self.automaticallyEraseValue) {
					$(this).parent().parent().find("input").val("");
				}
				$(this).parent().remove(); //remove list
			});
			$autocomplete_elt.html(elts_to_display[i]['autocomplete_display']);
			$autocomplete_elt.mouseover(function() {
				var $autocomplete_list = $(this).parent();
				var $autocomplete_choices = $autocomplete_list.children();
				for (var i = 0 ; i != $autocomplete_choices.length ; i++) {
					$($autocomplete_choices[i]).removeClass('autocomplete-list-selected');
				}
				$(this).addClass('autocomplete-list-selected');
			});
			$autocomplete_list.append($autocomplete_elt);
		}
		if (elts_to_display.length == 0) {
			$autocomplete_list.remove();
		}
	};
	
	// Compute the list of available choices based on the query
	self.computeChoices = function(query) {
		var elts_to_display = new Array();
		for (var i=0 ; i!=self.available_elts.length ; i++) {
			if (self.onFilterChoicesCallback
					&& self.onFilterChoicesCallback(self.$input, self.available_elts[i])) {
				continue;
			}
			var new_elt = self.computePriority(query, i);
			if (new_elt) {
				elts_to_display.push(new_elt);
			}
		}
		elts_to_display.sortOnBestScore();
		return self.numMaxResults > 0 ? elts_to_display.slice(0, self.numMaxResults) : elts_to_display;
	};
	
	// Compute the score for element i
	// Score is stored into the element itself
	self.computePriority = function(query, i) {
		var elt = self.available_elts[i];
		var elt_text = elt['autocomplete_rawdata_on'];
		var elt_text_lower = elt_text.toLowerCase();
		var query_lower = query.toLowerCase();
		
		var best_origin = -1;
		var best_score = -1;
		for (var i=0 ; i!=elt_text_lower.length ; i++) { // Look for a string starting from this element
			if (query_lower.length != 0 && elt_text_lower[i] != query_lower[0]) {
				continue;
			}
			var padding_pos = 0;
			var query_pos = 0;
			for (query_pos = 0 ; i+padding_pos != elt_text_lower.length && query_pos != query_lower.length ; padding_pos++) {
				if (elt_text_lower[i+padding_pos] == query_lower[query_pos]) {
					query_pos++;
				}
			}

			// Is there a match?
			// If so, is it better than current one?
			if (query_pos == query_lower.length) {//match
				if (best_score == -1 || best_score > padding_pos-query_pos) {
					best_origin = i;
					best_score = padding_pos-query_pos;
					if (best_score == 0) {
						break;
					}
				}
			}
		}

		// Highlight match characteristics
		if (best_score != -1) {
			var new_elt = elt;
			new_elt["autocomplete_score"] = best_score;
			if (query.length == 0) {
				new_elt['autocomplete_display'] = toSafeHtml(elt_text);
			} else {
				new_elt['autocomplete_display'] = "";
				var i = 0;
				var query_pos = 0;
				for ( ; i != elt_text_lower.length ; i++) {
					if (i >= best_origin && query_pos != query_lower.length && elt_text_lower[i] == query_lower[query_pos]) {
						new_elt['autocomplete_display'] += "<b>" + toSafeHtml(elt_text[i]) + "</b>";
						query_pos++;
					}
					else
					{
						new_elt['autocomplete_display'] += toSafeHtml(elt_text[i]);
					}
				}
			}
			return new_elt;
		}
		return undefined;
	};

	self.confirmChoice = function(selected_elt_id) {
		if (! self.onSelectCallback) {
			console.warn("No callback has been specified for onSelect");
			return;
		}

		var i = 0;
		for (i = 0 ; i != self.available_elts.length ; i++) {
			if (self.available_elts[i]['autocomplete_id'] == selected_elt_id) {
				break;
			}
		}
		if (i != self.available_elts.length) {
			var choice = self.available_elts[i];
			self.onSelectCallback(self.$input, self.available_elts[i]);
		}
	};
	
	// Check whether or not the autocompletion list
	// should still be visible
	// Hide the autocomplete-list if the click is not on:
	// - the input
	// - the autocomplete-list or one of its children
	self.clickSomewhere = function(event) {
		var target = event.target;
		if (target == self.$input[0]) {
			return;
		}
		var $expected_parent = self.$input.parent().find(".autocomplete-list");
		if (target == $expected_parent[0]) {
			return;
		}
		var $parents = $(target).parents();
		for (var i = 0 ; i != $parents.length ; i++) {
			if ($(this) == $($parents[i])) {
				return;
			}
		}
		self.$input.parent().find(".autocomplete-list").remove();
	};
	
	// Add autocompletion trigger to the input field
	{
		self.$input.keyup(self.reactKeyUp);
		self.$input.parent().css('position', 'relative');
		$(document).click(self.clickSomewhere);
	}
}

