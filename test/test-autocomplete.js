function buildAutocompleteFromArray(choices) {
	var autocomplete_choices = new Array();
	for (var i = 0 ; i != choices.length ; i++) {
		autocomplete_choices.push({
				autocomplete_id: i,
				autocomplete_rawdata_on: choices[i],
		});
	}
	return new AutocompleteItem($("input#autocomplete"), autocomplete_choices);
}

QUnit.start();

QUnit.module("AutocompleteItem::computePriority(str:query, int:index)");

QUnit.test("Empty choice", function(assert) {
	var autocomp = buildAutocompleteFromArray([""]);
	var resulting_elt = autocomp.computePriority("", 0);
	assert.strictEqual(resulting_elt, undefined, "Undefined result");
});

QUnit.test("Empty query", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var resulting_elt = autocomp.computePriority("", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'], "Choice", "Nothing into bold");
});

QUnit.test("Query: string itself", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var resulting_elt = autocomp.computePriority("Choice", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'],
			"<b>C</b><b>h</b><b>o</b><b>i</b><b>c</b><b>e</b>",
			"All characters into bold");
});

QUnit.test("Query: character from the string", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var resulting_elt = autocomp.computePriority("i", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'], "Cho<b>i</b>ce",
			"Only the matched character is into bold");
});

QUnit.test("Query: lower case / Choice: upper case", function(assert) {
	var autocomp = buildAutocompleteFromArray(["CHOICE"]);
	var resulting_elt = autocomp.computePriority("choice", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'],
			"<b>C</b><b>H</b><b>O</b><b>I</b><b>C</b><b>E</b>",
			"All characters into bold with same case as the original");
});

QUnit.test("Query: upper case / Choice: lower case", function(assert) {
	var autocomp = buildAutocompleteFromArray(["choice"]);
	var resulting_elt = autocomp.computePriority("CHOICE", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'],
			"<b>c</b><b>h</b><b>o</b><b>i</b><b>c</b><b>e</b>",
			"All characters into bold with same case as the original");
});

QUnit.test("Query: no match", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var resulting_elt = autocomp.computePriority("w", 0);
	assert.strictEqual(resulting_elt, undefined, "Undefined result");
});

QUnit.test("Query: match on two separate characters", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var resulting_elt = autocomp.computePriority("oe", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 2, "Score of 2");
	assert.equal(resulting_elt['autocomplete_display'], "Ch<b>o</b>ic<b>e</b>",
			"Matched characters into bold");
});

QUnit.test("Query: match on several separate characters", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var resulting_elt = autocomp.computePriority("Coe", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 3, "Score of 3");
	assert.equal(resulting_elt['autocomplete_display'], "<b>C</b>h<b>o</b>ic<b>e</b>",
			"Matched characters into bold");
});

QUnit.test("Query: multiple matches in the string", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Abracadabra"]);
	var resulting_elt = autocomp.computePriority("ACA", 0);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'],
			"Abr<b>a</b><b>c</b><b>a</b>dabra",
			"Only the best matched characters into bold");
});

QUnit.module("AutocompleteItem::computeChoices(str:query)");

QUnit.test("Eliminate mismatches", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Orange", "Red"]);
	var choices = autocomp.computeChoices("Orange");
	assert.equal(choices.length, 1, "Only a single match");
	assert.strictEqual(choices[0]["autocomplete_id"], 0, "Correct match");
});

QUnit.test("Order on score", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Orange", "Red"]);
	var choices = autocomp.computeChoices("re");
	assert.equal(choices.length, 2, "Exactly two choices");
	assert.ok(
			choices[0]["autocomplete_score"] < choices[1]["autocomplete_score"],
			"Correct order"); // This test does not test the resulting score but the order knowing it
});

QUnit.test("Order on text", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Orange", "Red"]);
	var choices = autocomp.computeChoices("r");
	assert.equal(choices.length, 2, "Exactly two choices");
	assert.ok(
			choices[0]["autocomplete_score"] == choices[1]["autocomplete_score"],
			"Same score");
	assert.ok(
			choices[0]["autocomplete_rawdata_on"] < choices[1]["autocomplete_rawdata_on"],
			"Correct order");
});

QUnit.test("Pre-Filter", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Orange", "Red"]);
	autocomp.setOnFilterChoicesCallback(function($input, selected_elt) {
		assert.ok(true, "Two items have to be scanned");
		if (selected_elt["autocomplete_id"] == 0) {
			return true;
		} else {
			return false;
		}
	});

	assert.expect(4);
	var choices = autocomp.computeChoices("");
	assert.equal(choices.length, 1, "Only a single match (the other filtered)");
	assert.equal(choices[0]["autocomplete_id"], 1, "Second item not filtered");
});

QUnit.module("AutocompleteItem::clickSomewhere(event)");

QUnit.test("Click outside", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var event = $.Event("keyup");
	event.keyCode = 40;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$("#qunit-fixture").click();
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("Click on input", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var event = $.Event("keyup");
	event.keyCode = 40;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$("input#autocomplete").click();
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
});

QUnit.test("Click on autocomplete list", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var event = $.Event("keyup");
	event.keyCode = 40;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$(".autocomplete-list").click();
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
});

QUnit.test("Click on choice", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	autocomp.setOnSelectCallback(function($input, selected_elt) {
		assert.strictEqual(selected_elt["autocomplete_id"], 0, "Selected item is #0");
	});
	autocomp.setAutomaticallyEraseValue(true); //prevent for change in default

	assert.expect(4);

	$("input#autocomplete").val("Ch");
	var event = $.Event("keyup");
	event.keyCode = 40;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	$(".autocomplete-list li").first().trigger("click");
	assert.strictEqual($("input#autocomplete").val(), "", "Input is empty");
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("Click on choice without erase", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	autocomp.setOnSelectCallback(function($input, selected_elt) {
		assert.strictEqual(selected_elt["autocomplete_id"], 0, "Selected item is #0");
	});
	autocomp.setAutomaticallyEraseValue(false);

	assert.expect(4);

	$("input#autocomplete").val("Ch");
	var event = $.Event("keyup");
	event.keyCode = 40;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	$(".autocomplete-list li").first().trigger("click");
	assert.strictEqual($("input#autocomplete").val(), "Ch", "Input keeps its value");
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.module("AutocompleteItem::reactKeyUp(event)");

QUnit.test("Toggle menu with keydown", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
});

QUnit.test("Navigate with keydown/keyup", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal($(".autocomplete-list .autocomplete-list-selected").length, 0, "Nothing selected");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"0", "First item selected");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"1", "Second item selected");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"1", "Second item selected");

	event.keyCode = 38;    
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"0", "First item selected");
});

QUnit.test("Hide menu with escape", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	event.keyCode = 27;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("Toggle menu with random key", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var event = $.Event("keyup");
	event.key = 'e';
	event.keyCode = 69;
	event.which = 69;
	$("input#autocomplete").val("e");
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
});

QUnit.test("Keep selected item focused when typing", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);

	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	var event = $.Event("keyup");
	event.key = 'e';
	event.keyCode = 69;
	event.which = 69;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	var arrow = $.Event("keyup");
	arrow.keyCode = 40;
	$("input#autocomplete").trigger(arrow);
	$("input#autocomplete").trigger(arrow);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list").children().length,
			2, "Exactly two choices available");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"1", "Second item selected");

	$("input#autocomplete").val("e2");
	event.key = '2';
	event.keyCode = 98;
	event.which = 98;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list").children().length,
			1, "Exactly one choice available");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"1", "Second item selected");
});

QUnit.test("Select with enter", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	autocomp.setOnSelectCallback(function($input, selected_elt) {
	assert.strictEqual(selected_elt["autocomplete_id"], 0, "Selected item is #0");
	});

	assert.expect(6);
	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").trigger(event);
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
		$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
		"0", "First item selected");

	event.keyCode = 13;    
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("Erase on selection", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	autocomp.setAutomaticallyEraseValue(true);

	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"0", "First item selected");

	event.keyCode = 13;    
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	assert.strictEqual($("input#autocomplete").val(), "", "Input is empty");
});

QUnit.test("Do not erase on selection", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	autocomp.setAutomaticallyEraseValue(false);

	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.strictEqual(
			$(".autocomplete-list .autocomplete-list-selected").attr('data-autocomplete-id'),
			"0", "First item selected");

	event.keyCode = 13;    
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	assert.strictEqual($("input#autocomplete").val(), "e", "Input is empty");
});

