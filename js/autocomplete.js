function compareForSortOnBestScore(a, b) {
	var a_score = a['autocomplete_score'];
	var b_score = b['autocomplete_score'];
	if(a_score < b_score){
		return -1;
	} else if(a_score > b_score) {
		return 1;
	} else {
		var a_raw = a['autocomplete_rawdata_on'];
		var b_raw = b['autocomplete_rawdata_on'];
		if (a_raw < b_raw) {
			return -1;
		} else if (a_raw > b_raw) {
			return 1;
		}
	}
	return 0;
}
function compareForSortOnBestScoreReversed(a, b) {
	var a_score = a['autocomplete_score'];
	var b_score = b['autocomplete_score'];
	if(a_score < b_score){
		return -1;
	} else if(a_score > b_score) {
		return 1;
	} else {
		var a_raw = a['autocomplete_rawdata_on'];
		var b_raw = b['autocomplete_rawdata_on'];
		if (a_raw < b_raw) {
			return 1;
		} else if (a_raw > b_raw) {
			return -1;
		}
	}
	return 0;
}

function shuffle(array) {
	var i = array.length, j, temp;
	if (i == 0) return array;
	while (--i) {
		j = Math.floor(Math.random() * (i + 1));
		temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
	return array;
}

function partialSortHelper(tab, num_elts, start, end, compare) {
	if (start >= end) {
		return;
	}

	var pivot_pos = start;
	var pivot_value = tab[end -1];

	var tmp_end = end -1;
	for (var pos = start ; pos != tmp_end ; ++pos) {
		// < pivot_value  |  pivot_value >=  |  unknown
		//                 ^                  ^
		//                 pivot_pos          pos
		var at_pos = tab[pos];
		if (compare(at_pos, pivot_value) == -1) {
			tab[pos] = tab[pivot_pos];
			tab[pivot_pos] = at_pos;
			++pivot_pos;
		}
	}
	// < pivot_value  | |  pivot_value >=
	//                 ^
	//                 pivot_pos
	tab[end -1] = tab[pivot_pos];
	tab[pivot_pos] = pivot_value;

	partialSortHelper(tab, num_elts, start, pivot_pos, compare);
	if (pivot_pos +1 < num_elts) {
		partialSortHelper(tab, num_elts, pivot_pos +1, end, compare);
	}
}

function partialSort(tab, num_elts, reversedOrder) {
	/** /!\ tab is modified,                                  *
	 *      elements might disappear(size might be different) *
	 *      ordering of elements might be changed too         */
	shuffle(tab);
	if (reversedOrder) {
		partialSortHelper(tab, num_elts, 0, tab.length, compareForSortOnBestScoreReversed);
	}
	else {
		partialSortHelper(tab, num_elts, 0, tab.length, compareForSortOnBestScore);
	}
	return tab.slice(0, num_elts);
}

function toSafeHtml(text) {
	return $("<a/>").text(text).html();
}

var AutocompleteItem = function($input, available_elts) {
	// jQuery element corresponding to a text input
	// This text input will benefit from autocompletion feature
	this.$input = $input;

	// A list of available elements that can be displayed to the end-user
	// Each element should have the fields:
	// - autocomplete_id
	// - autocomplete_rawdata_on: text to display during completion
	this.available_elts = available_elts;

	// Callback called when selecting an element from the autocomplete-list
	// Paramaters are: function($input, selected_elt)
	// - $input: the input linked to this object ie. self.$input
	// - selected_elt: an element from self.available_elts (self.available_elts[i])
	this.onSelectCallback = undefined;
	
	// Callback called when adding an element which is not part of the choices
	// If undefined, the user will not be able to add its own values
	// Paramaters are: function($input, text)
	// - $input: the input linked to this object ie. self.$input
	// - text: text entered by the user
	this.onAddCallback = undefined;

	// Callback called during the creation of the autocomplete-list
	// Parameters are: function($input, elt)
	// - $input: the input linked to this object ie. self.$input
	// - elt: an element from self.available_elts (self.available_elts[i])
	// Return:
	// - false: the element can be added to the list
	this.onFilterChoicesCallback = undefined;

	// Boolean to specify whether or not the field should be freed
	// after each selection
	this.automaticallyEraseValue = true;

	// The maximum number of results expected
	this.numMaxResults = -1;

	// The maximum number of results accepted
	// all the results might not be displayed depending on the value of numMaxResults
	this.showForTooMany = -1;

	// Order reversed means that
	// for each i, j such as i < j, item[i]["autocomplete_rawdata_on"] > item[j]["autocomplete_rawdata_on"]
	this.reversedOrder = false;

	// Add autocompletion trigger to the input field
	{
		this.$input.keyup((function(self) { return function(event) { return self.reactKeyUp(event, $(this)); }; })(this));
		this.$input.on('keypress', function(e) { return e.which !== 13; });
		this.$input.parent().css('position', 'relative');
		$(document).click((function(self) { return function(event) { return self.clickSomewhere(event, $(this)); }; })(this));
	}
};

// Update available elements available
AutocompleteItem.prototype.updateList = function(available_elts) {
	this.available_elts = available_elts;
};
	
AutocompleteItem.prototype.setOnSelectCallback = function(callback) {
	this.onSelectCallback = callback;
};

AutocompleteItem.prototype.setOnAddCallback = function(callback) {
	this.onAddCallback = callback;
};

AutocompleteItem.prototype.setOnFilterChoicesCallback = function(callback) {
	this.onFilterChoicesCallback = callback;
};

AutocompleteItem.prototype.setAutomaticallyEraseValue = function(automaticallyEraseValue) {
	this.automaticallyEraseValue = automaticallyEraseValue;
};

AutocompleteItem.prototype.setNumMaxResults = function(numMaxResults) {
	this.numMaxResults = numMaxResults;
};

AutocompleteItem.prototype.setShowForTooMany = function(showForTooMany) {
	this.showForTooMany = showForTooMany;
};

AutocompleteItem.prototype.enableReversedOrder = function(reversedOrder) {
	this.reversedOrder = reversedOrder;
};

// Called when an element from the list has been clicked
AutocompleteItem.prototype._elementClick = function($element, id) {
	this.confirmChoice(id);
	if (this.automaticallyEraseValue) {
		this.$input.val("");
	}
	$element.parent().remove(); //remove list
};

// Called when mouse moved over an element from the list
AutocompleteItem.prototype._elementOver = function($element, id) {
	var $autocomplete_list = $element.parent();
	var $autocomplete_choices = $autocomplete_list.children();
	for (var i = 0 ; i != $autocomplete_choices.length ; i++) {
		$($autocomplete_choices[i]).removeClass('autocomplete-list-selected');
	}
	$element.addClass('autocomplete-list-selected');
};

// Behaviour on 'key up' event
// Update autocomplete list
AutocompleteItem.prototype.reactKeyUp = function(event) {
	// Refresh the content of the autocomplete list
	// this.$input == self.jquery_input

	// Get autocomplete list or create it if not displayed
	var $input_parent = this.$input.parent();
	var $autocomplete_list = $input_parent.find(".autocomplete-list");
	if ($autocomplete_list.length == 0) {
		$autocomplete_list = $("<ul/>");
		$autocomplete_list.addClass("autocomplete-list");
		$input_parent.append($autocomplete_list);
	}

	// Show the autocomplete list at the right place
	var position_left = this.$input.position()['left'];
	var position_top = this.$input.position()['top'] + this.$input.outerHeight();
	$autocomplete_list.css('left', position_left + 'px');
	$autocomplete_list.css('top', position_top + 'px');
	
	// Get already selected elements position
	var $selected_elt = $autocomplete_list.find('.autocomplete-list-selected').first();
	var selected_elt_id = -1;
	if ($selected_elt.length == 1) {
		selected_elt_id = parseInt($selected_elt.attr('data-autocomplete-id'));
	}
	if ((selected_elt_id != -1 || this.onAddCallback !== undefined) && event.keyCode == 13) { // Enter
		if (selected_elt_id != -1) {
			this.confirmChoice(selected_elt_id);
		} else {
			this.onAddCallback(this.$input, this.$input.val());
		}
		if (this.automaticallyEraseValue) {
			this.$input.val("");
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
	var elts_to_display = this.computeChoices(this.$input.val());
	
	// Display elements
	$autocomplete_list.empty();
	for (var i=0 ; i != elts_to_display.length ; i++) {
		var $autocomplete_elt = $("<li/>");
		$autocomplete_elt.attr('data-autocomplete-id', elts_to_display[i]['autocomplete_id']);
		if (elts_to_display[i]['autocomplete_id'] == selected_elt_id) {
			$autocomplete_elt.addClass('autocomplete-list-selected');
		}
		$autocomplete_elt.click((function(self, $elt, id) { return function() { self._elementClick($elt, id); }; })(this, $autocomplete_elt, elts_to_display[i]['autocomplete_id']));
		$autocomplete_elt.html(elts_to_display[i]['autocomplete_display']);
		$autocomplete_elt.mouseover((function(self, $elt, id) { return function() { self._elementOver($elt, id); }; })(this, $autocomplete_elt, elts_to_display[i]['autocomplete_id']));
		$autocomplete_list.append($autocomplete_elt);
	}
	if (elts_to_display.length == 0) {
		$autocomplete_list.remove();
	}
};
	
// Compute display
AutocompleteItem.prototype._computeItemDisplay = function(elt, query) {
	var best_score = elt["autocomplete_score"];
	var best_origin = elt["autocomplete_best_origin"];
	
	var elt_text = elt['autocomplete_rawdata_on'];
	var elt_text_lower = elt_text.toLowerCase();
	var query_lower = query.toLowerCase();

	// Highlight match characteristics
	if (query.length == 0) {
		elt['autocomplete_display'] = toSafeHtml(elt_text);
	} else {
		elt['autocomplete_display'] = "";
		for (var i = 0, query_pos = 0 ; i != elt_text_lower.length ; ++i) {
			if (i >= best_origin && query_pos != query_lower.length && elt_text_lower[i] == query_lower[query_pos]) {
				elt['autocomplete_display'] += "<b>" + toSafeHtml(elt_text[i]) + "</b>";
				++query_pos;
			}
			else
			{
				elt['autocomplete_display'] += toSafeHtml(elt_text[i]);
			}
		}
	}
};

AutocompleteItem.prototype._computeAllItemsDisplay = function(items, query) {
	for (var i = 0 ; i != items.length ; ++i) {
		this._computeItemDisplay(items[i], query);
	}
	return items;
};

// Compute the list of available choices based on the query
AutocompleteItem.prototype.computeChoices = function(query) {
	var elts_to_display = new Array();
	for (var i = 0 ; i != this.available_elts.length ; ++i) {
		if (this.onFilterChoicesCallback
				&& this.onFilterChoicesCallback(this.$input, this.available_elts[i])) {
			continue;
		}
		var new_elt = this.computePriority(query, i);
		if (new_elt) {
			elts_to_display.push(new_elt);
			if (this.showForTooMany > 0 && elts_to_display.length > this.showForTooMany) {
				return [];
			}
		}
	}

	if (this.numMaxResults > 0) {
		return this._computeAllItemsDisplay(partialSort(elts_to_display, this.numMaxResults, this.reversedOrder), query);
	}

	if (this.reversedOrder) {
		elts_to_display.sort(function(a, b) { return compareForSortOnBestScoreReversed(a, b); });
	}
	else {
		elts_to_display.sort(function(a, b) { return compareForSortOnBestScore(a, b); });
	}
	return this._computeAllItemsDisplay(elts_to_display, query);
};

// Compute the score for element i
// Score is stored into the element itself
AutocompleteItem.prototype.computePriority = function(query, i) {
	var elt = this.available_elts[i];
	var elt_text = elt['autocomplete_rawdata_on'];
	var elt_text_lower = elt_text.toLowerCase();
	var query_lower = query.toLowerCase();
	
	var best_origin = -1;
	var best_score = -1;
	for (var i = 0 ; i != elt_text_lower.length ; ++i) { // Look for a string starting from this element
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
		new_elt["autocomplete_best_origin"] = best_origin;
		return new_elt;
	}
	return undefined;
};

AutocompleteItem.prototype.confirmChoice = function(selected_elt_id) {
	if (! this.onSelectCallback) {
		console.warn("No callback has been specified for onSelect");
		return;
	}

	var i = 0;
	for (i = 0 ; i != this.available_elts.length ; i++) {
		if (this.available_elts[i]['autocomplete_id'] == selected_elt_id) {
			break;
		}
	}
	if (i != this.available_elts.length) {
		var choice = this.available_elts[i];
		this.onSelectCallback(this.$input, this.available_elts[i]);
	}
};
	
// Check whether or not the autocompletion list
// should still be visible
// Hide the autocomplete-list if the click is not on:
// - the input
// - the autocomplete-list or one of its children
AutocompleteItem.prototype.clickSomewhere = function(event, $clicked) {
	var target = event.target;
	if (target == this.$input[0]) {
		return;
	}
	var $expected_parent = this.$input.parent().find(".autocomplete-list");
	if (target == $expected_parent[0]) {
		return;
	}
	var $parents = $(target).parents();
	for (var i = 0 ; i != $parents.length ; i++) {
		if ($clicked == $($parents[i])) {
			return;
		}
	}
	this.$input.parent().find(".autocomplete-list").remove();
};
