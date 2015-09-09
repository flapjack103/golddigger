var config = {
    firebaseURL: "https://sneakybueno.firebaseio.com/"
}

var FBCli = null

var app = {
    currentMonth: 0,

    currentTotal: 0,

    initialize: function() {
        FBCli = new FirebaseClient(config.firebaseURL);
        handlers.initialize();
        ui.initialize();
        this.setMonth(getCurrentMonthInt());
    },

    setMonth: function(month) {
        console.log('setting month ' + month);
        this.currentMonth = month;
        this.setDataByMonth(month);
    },

    setDataByMonth: function(month) {
        var that = this;
        FBCli.getTags(function(tags) {
            FBCli.getExpensesByMonth(month, function(expenses) {
                // If there are no expenses return;
                if (!expenses)
                    expenses = {};

                // What's our total
                that.currentTotal = calculateTotal(expenses);
                ui.setTotal();

                // Draw the pie chart
                var tagData = formatFBDataByTag(expenses);
                if (pieChart.initialized) {
                    pieChart.set(tagData);
                } else {
                    var tagsArray = tagJsonToArray(tags);
                    pieChart.initialize(960, 450, tagsArray, tagData);
                    FBCli.initEventHandlers();
                }

                // Draw the expenses by day of week
                var weekData = formatFBDataByDay(expenses);
                if (!weekChart.initialized) {
                    weekChart.initialize(weekData);
                }

                // Build the expense table and tag info collection
                tagCollection.build(tags, tagData);
                expenseTable.build(expenses);
            });
        });
    },

    updateTotal: function(expenses) {
        this.currentTotal += calculateTotal(expenses);
        ui.setTotal();
    }
};


var handlers = {
    initialize: function() {
        $('#goto-charts').click(function() {
            $('#expenses').hide();
            $('#charts').show();
        });

        $('#goto-expenses').click(function() {
            $('#charts').hide();
            $('#expenses').show();
        });

        $('#months').delegate('li', 'click', function() {
            var month = $(this).find('a').html();
            app.setMonth(months.indexOf(month));
        });
    },

    createTagFilterHandler: function(tagId) {
        $('#' + tagId).click(function() {
            var $this = $(this);
            var tagName = tagId.split('-')[1];
            if ($this.is(':checked')) {
                pieChart.showTag(tagName);
            } else {
                pieChart.hideTag(tagName);
            }
        });
    }
};

var ui = {
    initialize: function() {
        this.setDates();
    },

    setDates: function() {
        var months = $('#months').children();
        var monthIndex = getCurrentMonthInt();
        var monthNowElem = months[monthIndex];
        $(monthNowElem.children[0]).addClass('active');

        for (var i = monthIndex + 1; i < 12; i++) {
            var monthElem = months[i];
            $(monthElem).addClass('disabled');
        }
    },

    setTotal: function() {
        $('#table-total').html(moneyFormat(app.currentTotal / 100));
    }
}



var expenseTable = {
    build: function(expenses) {
        var table = $('#expense-table-body');
        table.html('');
        for (var expenseId in expenses) {
            if (expenses.hasOwnProperty(expenseId)) {
                var row = this.createTableRow(expenses[expenseId]);
                table.append(row);
            }
        }
    },
    // Amount, desc, tag, date, buyer
    createTableRow: function(expense) {
        var html = '<tr>';
        html += '<td>' + moneyFormat(expense.amount / 100) + '</td>';
        html += '<td>' + expense.description + '</td>';
        html += '<td>' + this.createTagImg(expense.tag) + '</td>';
        html += '<td>' + prettyDate(expense["purchase_date"]) + '</td>';
        html += '<td>' + this.createAvatarImg(expense.purchaser) + '</td>';
        return html;
    },

    createAvatarImg: function(purchaser) {
        var src = 'img/' + purchaser.toLowerCase() + '-avatar.jpg';
        return '<img class="circle" height="50px" src="' + src + '"/>';
    },

    createTagImg: function(tagName) {
        var tagInfo = tagCollection.tags[tagName];
        return '<i class="material-icons">' + tagInfo.icon + '</i>' + tagName;
    }
}

var tagCollection = {
    tags: {},

    build: function(tags, tagData) {
        $('#tag-collection').html('');
        for (var tagName in tags) {
            if (tags.hasOwnProperty(tagName)) {
                var tag = {};
                tag.icon = tags[tagName];
                tag.name = tagName;
                tag.value = 0;
                tagData.forEach(function(tagObjData) {
                    if (tagObjData.label == tag.name)
                        tag.value = tagObjData.value;
                });
                this.tags[tagName] = tag;
                this.fetchExpensesForTag(tag);
            }
        }
    },

    fetchExpensesForTag: function(tag) {
        var that = this;
        FBCli.getMonthlyExpensesByTag(tag.name, function(expenses) {
            console.log(tag.name);
            console.log(expenses);
            that.insertItem(tag, expenses);
        });
    },

    insertItem: function(tag, expenses) {
        var value = moneyFormat(tag.value / 100)
        var checkboxId = 'filter-' + tag.name;
        var expensesHtml = this.createExpenseListForTag(expenses);

        var html = '<li>';
        html += '<div class="collapsible-header">';
        html += '<input type="checkbox" class="filled-in" checked="checked" id="' + checkboxId + '">';
        html += '<i class="material-icons circle">' + tag.icon + '</i>';
        html += '<span class="title">' + tag.name + '</span>';
        html += '<span style="float:right;">' + value + '</span>';
        html += '</div>';
        html += '<div class="collapsible-body">' + expensesHtml + ' </div></li>';

        $('#tag-collection').append(html);
        handlers.createTagFilterHandler(checkboxId);
        $('#tag-collection').collapsible();
    },

    createExpenseListForTag: function(expenses) {
        if (!expenses || expenses.length == 0)
            return '<p> No purchases have been made with this tag. </p>';

        var html = '<table>';
        for (var expenseId in expenses) {
            if (expenses.hasOwnProperty(expenseId)) {
                var row = this.createTableRow(expenses[expenseId]);
                html += row;
            }
        }
        html += '</table>';
        return html;
    },

    createTableRow: function(expense) {
        var html = '<tr>';
        html += '<td>' + expense.description + '</td>';
        html += '<td>' + prettyDate(expense["purchase_date"]) + '</td>';
        html += '<td>' + moneyFormat(expense.amount / 100) + '</td>';
        return html;
    }
}

app.initialize();
