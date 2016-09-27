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
	var query = "";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'], "Choice", "Nothing into bold");
});

QUnit.test("Query: string itself", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var query = "Choice";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'],
			"<b>C</b><b>h</b><b>o</b><b>i</b><b>c</b><b>e</b>",
			"All characters into bold");
});

QUnit.test("Query: character from the string", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var query = "i";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'], "Cho<b>i</b>ce",
			"Only the matched character is into bold");
});

QUnit.test("Query: lower case / Choice: upper case", function(assert) {
	var autocomp = buildAutocompleteFromArray(["CHOICE"]);
	var query = "choice";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'],
			"<b>C</b><b>H</b><b>O</b><b>I</b><b>C</b><b>E</b>",
			"All characters into bold with same case as the original");
});

QUnit.test("Query: upper case / Choice: lower case", function(assert) {
	var autocomp = buildAutocompleteFromArray(["choice"]);
	var query = "CHOICE";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 0, "Score of 0");
	assert.equal(resulting_elt['autocomplete_display'],
			"<b>c</b><b>h</b><b>o</b><b>i</b><b>c</b><b>e</b>",
			"All characters into bold with same case as the original");
});

QUnit.test("Query: no match", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var query = "w";
	var resulting_elt = autocomp.computePriority(query, 0);
	assert.strictEqual(resulting_elt, undefined, "Undefined result");
});

QUnit.test("Query: match on two separate characters", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var query = "oe";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 2, "Score of 2");
	assert.equal(resulting_elt['autocomplete_display'], "Ch<b>o</b>ic<b>e</b>",
			"Matched characters into bold");
});

QUnit.test("Query: match on several separate characters", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var query = "Coe";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
	assert.notStrictEqual(resulting_elt, undefined, "Defined result");
	assert.equal(resulting_elt['autocomplete_score'], 3, "Score of 3");
	assert.equal(resulting_elt['autocomplete_display'], "<b>C</b>h<b>o</b>ic<b>e</b>",
			"Matched characters into bold");
});

QUnit.test("Query: multiple matches in the string", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Abracadabra"]);
	var query = "ACA";
	var resulting_elt = autocomp.computePriority(query, 0);
	autocomp._computeItemDisplay(resulting_elt, query);
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

QUnit.test("Order on score (2)", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Red", "Orange"]);
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

QUnit.test("Order on text (2)", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Red", "Orange"]);
	var choices = autocomp.computeChoices("r");
	assert.equal(choices.length, 2, "Exactly two choices");
	assert.ok(
			choices[0]["autocomplete_score"] == choices[1]["autocomplete_score"],
			"Same score");
	assert.ok(
			choices[0]["autocomplete_rawdata_on"] < choices[1]["autocomplete_rawdata_on"],
			"Correct order");
});

QUnit.test("Order on text (reversed)", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Red", "Orange"]);
	autocomp.enableReversedOrder(true);
	var choices = autocomp.computeChoices("r");
	assert.equal(choices.length, 2, "Exactly two choices");
	assert.ok(
			choices[0]["autocomplete_score"] == choices[1]["autocomplete_score"],
			"Same score");
	assert.ok(
			choices[0]["autocomplete_rawdata_on"] > choices[1]["autocomplete_rawdata_on"],
			"Correct order");
});

QUnit.test("Equality on both score and data", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Purple", "Orange", "Red", "Purple"]);
	var choices = autocomp.computeChoices("r");
	assert.equal(choices.length, 4, "Exactly four choices");
	assert.ok(
			choices[0]["autocomplete_score"] == choices[1]["autocomplete_score"]
			&& choices[0]["autocomplete_score"] == choices[2]["autocomplete_score"]
			&& choices[0]["autocomplete_score"] == choices[3]["autocomplete_score"],
			"Same score for everyone");
	assert.ok(
			choices[0]["autocomplete_rawdata_on"] < choices[1]["autocomplete_rawdata_on"],
			"Correct order");
	assert.ok(
			choices[1]["autocomplete_rawdata_on"] == choices[2]["autocomplete_rawdata_on"],
			"Correct order");
	assert.ok(
			choices[2]["autocomplete_rawdata_on"] < choices[3]["autocomplete_rawdata_on"],
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
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal($(".autocomplete-list").children().length, 2, "Two items visible");
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
});

QUnit.test("Toggle menu with keyup", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	var event = $.Event("keyup");
	event.keyCode = 38;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal($(".autocomplete-list").children().length, 2, "Two items visible");
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
});

QUnit.test("Toggle menu with enter", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	var event = $.Event("keyup");
	event.keyCode = 13;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal($(".autocomplete-list").children().length, 2, "Two items visible");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").length, 0, "No item selected");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal($(".autocomplete-list").children().length, 2, "Two items visible");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").length, 0, "No item selected");
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
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.ok($(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item selected");

	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.ok($(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item selected");

	event.keyCode = 38;    
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
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
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
});

QUnit.test("Toggle menu with random key and hide when no match", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice"]);
	var event = $.Event("keyup");
	event.key = 'e';
	event.keyCode = 69;
	event.which = 69;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$("input#autocomplete").val("ee");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
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
	assert.ok($(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#2", "Choice#2 selected");

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
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#2", "Choice#2 selected");
});

QUnit.test("Select with enter", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	autocomp.setOnSelectCallback(function($input, selected_elt) {
		assert.strictEqual(selected_elt["autocomplete_id"], 0, "Selected item is #0");
	});

	assert.expect(7);
	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").trigger(event);
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			1, "One item is selected");
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#1", "Choice#1 selected");

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
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#1", "Choice#1 selected");

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
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#1", "Choice#1 selected");

	event.keyCode = 13;    
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	assert.strictEqual($("input#autocomplete").val(), "e", "Input is empty");
});

QUnit.test("Autocomplete with free text: empty", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	
	assert.expect(2);

	var key_enter = $.Event("keyup");
	key_enter.keyCode = 13;

	// Call add for empty string
	autocomp.setOnAddCallback(function($input, text) {
		assert.strictEqual(text, "", "Call to add callback with ''");
	});
	$("input#autocomplete").trigger(key_enter);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("Autocomplete with free text: with existing choices", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	
	assert.expect(3);

	var key_enter = $.Event("keyup");
	key_enter.keyCode = 13;
	var key_e = $.Event("keyup");
	key_e.key = 'e';
	key_e.keyCode = 69;
	key_e.which = 69;

	// Call add for real string but existing choices
	autocomp.setOnAddCallback(function($input, text) {
		assert.strictEqual(text, "e", "Call to add callback with 'e'");
	});
	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(key_e);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$("input#autocomplete").trigger(key_enter);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("Autocomplete with free text: without existing choices", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	
	assert.expect(4);

	var key_enter = $.Event("keyup");
	key_enter.keyCode = 13;
	var key_e = $.Event("keyup");
	key_e.key = 'e';
	key_e.keyCode = 69;
	key_e.which = 69;

	// Call add for real string but non-existing choices
	autocomp.setOnAddCallback(function($input, text) {
		assert.strictEqual(text, "ee", "Call to add callback with 'ee'");
	});
	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(key_e);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$("input#autocomplete").val("ee");
	$("input#autocomplete").trigger(key_e);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	$("input#autocomplete").trigger(key_enter);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("Autocomplete with free text: selected choice", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	
	assert.expect(3);

	var key_enter = $.Event("keyup");
	key_enter.keyCode = 13;
	var key_down = $.Event("keyup");
	key_down.keyCode = 40;
	var key_e = $.Event("keyup");
	key_e.key = 'e';
	key_e.keyCode = 69;
	key_e.which = 69;

	// Do not call if on a real choice
	autocomp.setOnAddCallback(function($input, text) {
		assert.strictEqual(text, "e", "(not expected) Call to add callback with 'e'");
	});
	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(key_e);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$("input#autocomplete").trigger(key_down);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	$("input#autocomplete").trigger(key_enter);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
});

QUnit.test("No item selected when showing the list", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);

	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list .autocomplete-list-selected").length,
			0, "No item is selected");
});

QUnit.test("Limit the number of results", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);
	autocomp.setNumMaxResults(1);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	var event = $.Event("keyup");
	event.key = 'e';
	event.keyCode = 69;
	event.which = 69;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list").children().length,
			1, "Exactly one choice available due to limit");
	assert.strictEqual(
			$(".autocomplete-list li").text(),
			"Choice#1", "First item visible only");

	$("input#autocomplete").val("e2");
	var event = $.Event("keyup");
	event.key = '2';
	event.keyCode = 98;
	event.which = 98;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal(
			$(".autocomplete-list").children().length,
			1, "Exactly one choice available due to limit");
	assert.strictEqual(
			$(".autocomplete-list li").text(),
			"Choice#2", "Second item visible only");
});

QUnit.test("Very large dictionary set", function(assert) {
	var autocomp = buildAutocompleteFromArray(dictionary);
	autocomp.setNumMaxResults(10);
	
	$("input#autocomplete").val("w");
	var event = $.Event("keyup");
	event.key = 'w';
	event.keyCode = 119;
	event.which = 119;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	
	$("input#autocomplete").val("we");
	var event = $.Event("keyup");
	event.key = 'e';
	event.keyCode = 101;
	event.which = 101;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	
	$("input#autocomplete").val("web");
	var event = $.Event("keyup");
	event.key = 'b';
	event.keyCode = 98;
	event.which = 98;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	
	$("input#autocomplete").val("weba");
	var event = $.Event("keyup");
	event.key = 'a';
	event.keyCode = 97;
	event.which = 97;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	
	var quit_event = $.Event("keyup");
	quit_event.keyCode = 27;    
	$("input#autocomplete").trigger(quit_event);
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");
	
	$("input#autocomplete").val("w");
	var event = $.Event("keyup");
	event.key = 'w';
	event.keyCode = 119;
	event.which = 119;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	
	$("input#autocomplete").val("we");
	var event = $.Event("keyup");
	event.key = 'e';
	event.keyCode = 101;
	event.which = 101;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	
	$("input#autocomplete").val("web");
	var event = $.Event("keyup");
	event.key = 'b';
	event.keyCode = 98;
	event.which = 98;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	
	$("input#autocomplete").val("weba");
	var event = $.Event("keyup");
	event.key = 'a';
	event.keyCode = 97;
	event.which = 97;
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
});

QUnit.test("Partial sort", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#5", "Choice#2", "Choice#6", "Choice#1", "Choice#3", "Choice#4"]);
	autocomp.setNumMaxResults(3);

	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");
	assert.equal($(".autocomplete-list li").length, 3, "Autocompletelist contains 3 items");

	assert.strictEqual(
			$(".autocomplete-list li").eq(0).text(),
			"Choice#1", "Choice#1");
	assert.strictEqual(
			$(".autocomplete-list li").eq(1).text(),
			"Choice#2", "Choice#2");
	assert.strictEqual(
			$(".autocomplete-list li").eq(2).text(),
			"Choice#3", "Choice#3");
});

QUnit.module("AutocompleteItem::mouseover");

QUnit.test("Highlight the item on onmouseover", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);

	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	$(".autocomplete-list").children().eq(0).mouseover();
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#1", "Choice#1 selected");
	
	$(".autocomplete-list").children().eq(1).mouseover();
	assert.ok($(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#2", "Choice#2 selected");
});

QUnit.test("Remove highlight from other items", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);

	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	$(".autocomplete-list").children().eq(0).mouseover();
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
	assert.ok(! $(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item not selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#1", "Choice#1 selected");

	$(".autocomplete-list").children().eq(1).mouseover();
	assert.ok(! $(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item not selected");
	assert.ok($(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#2", "Choice#2 selected");
});

QUnit.test("Keep consistent with key up", function(assert) {
	var autocomp = buildAutocompleteFromArray(["Choice#1", "Choice#2"]);

	var event = $.Event("keyup");
	event.keyCode = 40;
	assert.equal($(".autocomplete-list").length, 0, "Autocompletelist is not visible");

	$("input#autocomplete").val("e");
	$("input#autocomplete").trigger(event);
	assert.equal($(".autocomplete-list").length, 1, "Autocompletelist is visible");

	$(".autocomplete-list").children().eq(0).mouseover();
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
	assert.ok(! $(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item not selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#1", "Choice#1 selected");

	$("input#autocomplete").trigger(event);
	assert.ok(! $(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item not selected");
	assert.ok($(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#2", "Choice#2 selected");
	
	$(".autocomplete-list").children().eq(0).mouseover();
	assert.ok($(".autocomplete-list").children().eq(0).hasClass("autocomplete-list-selected"), "First item selected");
	assert.ok(! $(".autocomplete-list").children().eq(1).hasClass("autocomplete-list-selected"), "Second item not selected");
	assert.strictEqual($(".autocomplete-list .autocomplete-list-selected").first().text(), "Choice#1", "Choice#1 selected");
});

QUnit.module("::partialSort(tab, num_results)");

QUnit.test("Sort on score", function(assert) {
	var tab = [
		{"autocomplete_score": 4, "autocomplete_rawdata_on": "testB"},
		{"autocomplete_score": 2, "autocomplete_rawdata_on": "testA"},
		{"autocomplete_score": 3, "autocomplete_rawdata_on": "testC"},
		{"autocomplete_score": 1, "autocomplete_rawdata_on": "testD"},
	];
	var cloned_tab = tab.slice();
	var sorted_tab = partialSort(tab, 4);
	assert.equal(sorted_tab[0], cloned_tab[3], "Item 0");
	assert.equal(sorted_tab[1], cloned_tab[1], "Item 1");
	assert.equal(sorted_tab[2], cloned_tab[2], "Item 2");
	assert.equal(sorted_tab[3], cloned_tab[0], "Item 3");
});
QUnit.test("Sort on raw data", function(assert) {
	var tab = [
		{"autocomplete_score": 1, "autocomplete_rawdata_on": "testB"},
		{"autocomplete_score": 1, "autocomplete_rawdata_on": "testA"},
		{"autocomplete_score": 1, "autocomplete_rawdata_on": "testC"},
		{"autocomplete_score": 1, "autocomplete_rawdata_on": "testD"},
	];
	var cloned_tab = tab.slice();
	var sorted_tab = partialSort(tab, 4);
	assert.equal(sorted_tab[0], cloned_tab[1], "Item 0");
	assert.equal(sorted_tab[1], cloned_tab[0], "Item 1");
	assert.equal(sorted_tab[2], cloned_tab[2], "Item 2");
	assert.equal(sorted_tab[3], cloned_tab[3], "Item 3");
});
QUnit.test("Only return the sorted values", function(assert) {
	var tab = [
		{"autocomplete_score": 1, "autocomplete_rawdata_on": "testB"},
		{"autocomplete_score": 2, "autocomplete_rawdata_on": "testA"},
		{"autocomplete_score": 1, "autocomplete_rawdata_on": "testC"},
		{"autocomplete_score": 2, "autocomplete_rawdata_on": "testD"},
	];
	var cloned_tab = tab.slice();
	var sorted_tab = partialSort(tab, 3);
	assert.equal(sorted_tab.length, 3, "Only sorted values are returned");
	assert.equal(sorted_tab[0], cloned_tab[0], "Item 0");
	assert.equal(sorted_tab[1], cloned_tab[2], "Item 1");
	assert.equal(sorted_tab[2], cloned_tab[1], "Item 2");
});
