var BattleMap = {
	defaultValue: 10,
	maxValue: 50,
	rows: 0,
	columns: 0,
	tableTags: {
		table: "<table>",
		close_table: "</table",
		header: "<th>",
		close_header: "</th>",
		row: "<tr>",
		close_row: "</tr>",
		cell: "<td>",
		close_cell: "</td>"
	},

	genTags: {
		table: "",
		close_table: "",
		header: "|! ",
		close_header: "",
		row: "",
		close_row: "|\n",
		cell: "| ",
		close_cell: ""
	},

	gridData: {data: []},

	removeEmptyElements: function() {
		var tempArray = [];

		console.log(this.gridData);
		for (x = 0; x < this.gridData.data.length; x++) {
			var element = this.gridData.data[x];

			if (element == null) continue;
			if (Array.isArray(element)) continue;

			tempArray.push(element);
		}

		this.gridData.data = tempArray;
	},

	numToAlpha: function(number) {
		var doubleUp = false;

		if (number > 26) {
			number = number - 26;
			doubleUp = true;
		}

		var value = String.fromCharCode(number + 64);

		return doubleUp ? value + value : value;
	},

	pad: function(number, width, character) {
		var pad_char = typeof character !== "undefined" ? character : "0";
		var pad = new Array(1 + width).join(pad_char);
		return (pad + number).slice(-pad.length);
	},

	cap: function(value, max) {
		max = typeof max !== "undefined" ? max : this.maxValue;
		return value > max ? max : value;
	},

	setToNumber: function(value) {
		return $.isNumeric(value) ? value : this.defaultValue;
	},

	getRows: function() {
		var num = this.setToNumber($("#form_rows").val());
		this.rows = this.cap(num);
	},

	setRowsFromProperty: function() {
		$("#form_rows").val(this.rows);
	},

	getColumns: function() {
		this.columns = this.cap(this.setToNumber($("#form_columns").val()));
	},

	setColumnsFromProperty: function() {
		$("#form_columns").val(this.columns);
	},

	tableHeader: function(useTags) {
		var t = useTags ? this.genTags : this.tableTags;
		var table = t.table + t.row + t.header + t.close_header;

		for (y = 1; y <= this.columns; y++) {
			table += t.header + this.numToAlpha(y) + t.close_header;
		}
		table += t.close_row;

		return table;
	},

	addColor: function(cell) {
		if (cell.attr("color") == "default") {
			return cell.val();
		} else {
			if (cell.val().length < 1) return "";
			return "<" + cell.attr("color") + ">" + cell.val() + "</" + cell.attr("color") + ">";
		}
	},

	tableColumns: function(row_num, useTags, buildFromInput) {
		var t = useTags ? this.genTags : this.tableTags;
		var row = typeof row_num !== "undefined" ? row_num : this.pad(row_num, 2, 0);
		var cols = "";
		var rowArray = [];

		for (y = 1; y <= this.columns; y++) {
			cols += t.cell;
			if (useTags) {
				var cell = $("#cell_" + row + "_" + this.numToAlpha(y));
				cols += this.addColor(cell);
				rowArray.push({
					column: this.numToAlpha(y),
					color: cell.attr("color"),
					value: cell.val(),
				});
			} else {
				cols += "<input class='gridCell' type='text' size='2' id='cell_" + row + "_" + this.numToAlpha(y) + "' ";
				if (buildFromInput) {
					var rowInt = parseInt(row) - 1;
					cols += "color='" + this.gridInput.data[rowInt].columns[y - 1].color + "' ";
					cols += "value='" + this.gridInput.data[rowInt].columns[y - 1].value + "'>";
				} else {
					cols += "color='default'>";
				}
			}
			cols += t.close_cell;
		}

		this.gridData.data.push({row: row_num, columns: rowArray});
		//console.log("Rows: " + this.gridData.data.length + " Columns: " + this.gridData.data[0].columns.length);
		return cols;
	},

	tableRow: function(row_num, useTags, buildFromInput) {
		var t = useTags ? this.genTags : this.tableTags;
		var row = t.row + t.header + this.pad(row_num, 2, 0) + t.close_header;

		row += this.tableColumns(row_num, useTags, buildFromInput);
		row += t.close_row;

		return row;
	},

	tableFooter: function(useTags) {
		var t = useTags ? this.genTags : this.tableTags;
		return t.close_table;
	},

	buildGrid: function(useTags, buildFromInput) {
		var grid = useTags ? $("#generated_grid") : $("#grid");
		var table = "";

		if (buildFromInput) {
			this.gridInput = $.parseJSON($("#grid_input").val());

			this.rows = this.gridInput.data.length;
			this.columns = this.gridInput.data[0].columns.length;
			this.setRowsFromProperty();
			this.setColumnsFromProperty();
		} else {
			this.getRows();
			this.getColumns();
		}

		if (useTags) this.gridData = {data: []};

		grid.empty();

		table += this.tableHeader(useTags);

		for (x = 1; x <= this.rows; x++) {
			table += this.tableRow(this.pad(x, 2, 0), useTags, buildFromInput);
		}

		table += this.tableFooter(useTags);

		return table;
	},

	showGrid: function() {
		var gridInput = $("#grid_input");
		var buildFromInput = gridInput.val().length > 0;

		var text = this.buildGrid(false, buildFromInput);
		var grid = $("#grid");

		grid.append(text);

		grid.append("<form>");
		grid.append("<input type='radio' name='color' value='default' checked> Default ");
		grid.append("<input type='radio' name='color' value='blue'> Blue ");
		grid.append("<input type='radio' name='color' value='red'> Red ");
		grid.append("<input type='radio' name='color' value='black'> Black ");
		grid.append("<input type='radio' name='color' value='green'> Green ");
		grid.append("<input type='radio' name='color' value='yellow'> Yellow ");
		grid.append("<input type='radio' name='color' value='gray'> Gray ");
		grid.append("<input type='radio' name='color' value='orange'> Orange <br>");

		grid.append("<input type='button' value='Generate Grid' id='button_generate_grid'>");
		$("#button_generate_grid").bind("click", $.proxy(this.generateGrid, this));
		$(".gridCell").bind("focus", this.doColor);
	},

	generateGrid: function() {
		this.gridData = {data: []};
		text = this.buildGrid(true, false);
		var grid = $("#generated_grid");
		var data = $("#grid_data");

		grid.text(text);

		this.removeEmptyElements();
		data.text(JSON.stringify(this.gridData));
	},

    saveGrid: function() {
        if (this.gridData.data.length == 0) {
            this.alert("You haven't generated a grid to save.");
            return;
        }
        if (!Storage) {
            this.alert("Your browser doesn't support local storage.");
            return;
        }

        var db = document.localStorage;
         
    },

    alert: function(msg) {
        var div = $("#alert_div");
        var html = "<div class='alert alert-dismissible alert-warning'>";
        html += "<button type='button' class='close' data-dismiss='alert'>&times;</button>";
        html += "<h4>Warning!</h4>";
        html += "<p>" + msg + "</p>";
        html += "</div>";
        div.append(html);
    },

	doColor: function() {
		var color = $("input[name='color']:checked").val();
		$(this).attr("color", color);
		if (color == "default") {
			$(this).css("color", "");
		} else {
			$(this).css("color", color);
		}
	}
};
