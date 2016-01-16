(function(exports) {

function ResizableTable($table) {
	var self = this;

	var $_table_container = $("<div/>");
	var $_table = $table;
	self._ongoing_changes = false;

	var _onResize = undefined;

	// Resize the table with given columns dimensions (try to apply these dimensions)
	// @param sizes Array of dimensions that should be applied to columns
	//     if the number of given dimensions differ from the number of columns: unspecified behaviour
	//     if one of the dimensions is negative: unspecified behaviour
	//     if sum of dimensions different from table's size, will apply a ratio to have the new values
	self.resize = function(sizes) {
		if (self._ongoing_changes) {
			return;
		}
		self._ongoing_changes = true;

		// move cursors towards expected result
		var $columns = $_table.find("> thead > tr > th");
		if (sizes.length != $columns.length) {
			console.warn("ResizableTable::resize: the number of given dimensions differ from the number of columns");
			return;
		}
		var total_size = 0;
		for (var i = 0 ; i != sizes.length ; ++i) {
			total_size += sizes[i];
		}
		var ratio = $_table_container.outerWidth() / total_size;
		var $cursors = $_table_container.find("> div.resizable-table-cursor");
		var last = 0;
		for (var i = 0 ; i != sizes.length ; ++i) {
			last += ratio * sizes[i];
			$cursors.eq(i).css("left", last);
		}

		// resize the table itself to follow the cursors
		self.resizeToLastKnown(true);

		// move the cursor to their new positions (table not be exactly inlined with cursors that is why we move the cursors)
		self.refresh();
		self._ongoing_changes = false;
	};

	// Resize the table to fit with last known cursors
	// Table adapts to cursors
	// @param no_callback Deactivate onResize callback for this call, Default=false
	self.resizeToLastKnown = function(no_callback) {
		if (no_callback !== true) {
			if (self._ongoing_changes) {
				return;
			}
			self._ongoing_changes = true;
		}
		var $cursors = $_table_container.find("> div.resizable-table-cursor");
		var $columns = $_table.find("> thead > tr > th");
		var previous = 0;
		for (var i = 0 ; i != $cursors.length ; ++i) {
			var left = $cursors.eq(i).position().left;
			$columns.eq(i).outerWidth(left-previous);
			previous = left;
		}

		if (no_callback !== true) {
			if (_onResize !== undefined) {
				_onResize(self, $_table, self.getSizes());
			}
			self._ongoing_changes = false;
		}
	};

	// Refresh the cursors' position to fit with current table's state
	// Cursors adapt to table
	self.refresh = function() {
		// remove existing cursors
		$_table_container.find("> div.resizable-table-cursor").remove();

		// scan table's columns
		var $columns = $_table.find("> thead > tr > th");
		for (var i = 1 ; i < $columns.length ; ++i) {
			var $column = $columns.eq(i);
			var $cursor = $("<div/>");
			$cursor.addClass("resizable-table-cursor");
			$cursor.css("left", $column.position().left);
			$cursor.css("top", 0);
			$cursor.on("mousedown", (function($cursor) {
				return function(e) {
					var move_handler = function(e) {
						var x = e.pageX;
						var newPosition = x - $_table_container.position().left;
						var maxPosition = $_table_container.outerWidth();
						if (newPosition >= 0 && newPosition < maxPosition) {
							$cursor.css("left", newPosition);
							self.resizeToLastKnown();
						}
					};
					$("body").bind("mousemove", move_handler);
					$("body").on("mouseup", function() {
						$("body").unbind("mousemove", move_handler);
						self.refresh();
					});
				};
			})($cursor));
			$_table_container.append($cursor);
		}

		if (_onResize !== undefined) {
			_onResize(self, $_table, self.getSizes());
		}
	};

	// Callback will be called each time a resize operation handled by ResizableTable
	// imply changes columns's dimension
	// Callback receives the parameters:
	//  - self:   instance of ResizableTable
	//  - $table: jQuery DOM of the table
	//  - sizes:  column's dimensions
	self.registerOnResize = function(callback) {
		_onResize = callback;
		return self;
	};

	// @return current columns's dimensions
	self.getSizes = function() {
		var $columns = $_table.find("> thead > tr > th");
		var sizes = new Array();
		for (var i = 0 ; i != $columns.length ; ++i) {
			sizes.push($columns.eq(i).outerWidth());
		}
		return sizes;
	};

	{
		$_table_container.addClass("resizable-table-container");
		$_table.before($_table_container); // create table container to wrap the table (created before the table element)
		$_table_container.append($_table); // move table into the container

		self.refresh();
	}
}

exports.ResizableTable = ResizableTable;

}(typeof exports === 'undefined'
		? (this['JsTools'] === undefined ? this['JsTools']={} : this['JsTools'])
		: exports));

var ResizableTable = JsTools.ResizableTable;
