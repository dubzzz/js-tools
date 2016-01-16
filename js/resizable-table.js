(function(exports) {

function ResizableTable($table) {
	var self = this;

	var $_table_container = $("<div/>");
	var $_table = $table;

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
			$_table_container.append($cursor);
		}
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
