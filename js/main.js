var config = {
    firebaseURL: "https://sneakybueno.firebaseio.com/"
}

var app = {
    currentMonth: 0,

    initialize: function() {
        firebase.initialize(config.firebaseURL);
        handlers.initialize();
        ui.initialize();
        this.setMonth(utils.getCurrentMonthInt());
    },

    setMonth: function(month) {
        console.log('setting month ' + month);
        this.currentMonth = month;
        this.setDataByMonth(month);
    },

    setDataByMonth: function(month) {
        firebase.getTags(function(tags) {
            firebase.getExpensesByMonth(month, function(expenses) {
                // If there are no expenses return;
                if (!expenses)
                    expenses = {};

                // Draw the pie chart
                tagData = utils.formatFBDataByTag(expenses);
                if (pieChart.initialized) {
                    pieChart.set(tagData);
                    firebase.initEventHandlers();
                } else {
                    var tagsArray = utils.tagJsonToArray(tags);
                    pieChart.initialize(960, 450, tagsArray, tagData);
                }

                // Build the expense table and tag info collection
                expenseTable.build(expenses);
                tagCollection.build(tags, tagData);
            });
        });
    }
};

var firebase = {
    initialize: function(url) {
        this.baseURL = url;
        this.tagsRef = new Firebase(this.baseURL + "tags");
        this.expensesRef = new Firebase(this.baseURL + "expenses");
    },

    initEventHandlers: function() {
        this.expensesRef.orderByChild("purchase_date")
            .on("child_added", function(snapshot) {
                data = snapshot.val();
                data = utils.formatFBDataByTag(data);
                pieChart.update(data);
            });
    },

    getTags: function(callback) {
        this.tagsRef.on("value", function(snapshot) {
            callback(snapshot.val());
        }, function(error) {
            console.log("The read failed: " + error.code);
            callback([]);
        });
    },

    getExpensesByMonth: function(month, callback) {
        startTime = new Date(2015, month, 1).getTime() / 1000;
        endTime = new Date(2015, month + 1, 0).getTime() / 1000;

        this.expensesRef.orderByChild("purchase_date")
            .startAt(startTime)
            .endAt(endTime)
            .on("value", function(snapshot) {
                callback(snapshot.val());
            }, function(error) {
                console.log("The read failed: " + error.code);
                callback([]);
            });
    },

    getAllExpenses: function(callback) {
        this.expensesRef.orderByChild("purchase_date")
            .on("value", function(snapshot) {
                callback(snapshot.val());
            }, function(error) {
                console.log("The read failed: " + error.code);
                callback([]);
            });
    },

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
            app.setMonth(utils.months[month]);
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
        months = $('#months').children();
        monthIndex = utils.getCurrentMonthInt();
        monthNowElem = months[monthIndex];
        $(monthNowElem.children[0]).addClass('active');

        for (var i = monthIndex + 1; i < 12; i++) {
            monthElem = months[i];
            $(monthElem).addClass('disabled');
        }
    },

}

var utils = {
    months: {
        "Jan": 0,
        "Feb": 1,
        "Mar": 2,
        "Apr": 3,
        "May": 4,
        "Jun": 5,
        "Jul": 6,
        "Aug": 7,
        "Sep": 8,
        "Oct": 9,
        "Nov": 10,
        "Dec": 11
    },

    getCurrentMonthInt: function() {
        d = new Date();
        return d.getMonth()
    },

    tagJsonToArray: function(tagsObj) {
        tagsArray = [];
        for (var key in tagsObj) {
            if (tagsObj.hasOwnProperty(key)) {
                tagsArray.push(key);
            }
        }
        return tagsArray;
    },

    formatFBDataByTag: function(expenses) {
        var dataByTag = {};
        for (var expenseId in expenses) {
            if (expenses.hasOwnProperty(expenseId)) {
                var expenseObj = expenses[expenseId];
                var tagName = expenseObj.tag;
                if (dataByTag.hasOwnProperty(tagName)) {
                    dataByTag[tagName].amount += expenseObj.amount;
                } else {
                    dataByTag[tagName] = {}
                    dataByTag[tagName].amount = expenseObj.amount;
                    dataByTag[tagName].id = expenseId;
                }
            }
        }

        var data = [];
        for (var tagName in dataByTag) {
            if (dataByTag.hasOwnProperty(tagName)) {
                tagObj = dataByTag[tagName];
                var item = {};
                item.label = tagName;
                item.value = tagObj.amount;
                data.push(item);
            }
        }

        return data;
    },

    prettyDate: function(epoch) {
        var days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

        epoch = parseInt(epoch) * 1000;
        date = new Date(epoch);
        dateStr = '';
        dateStr += days[date.getDay()] + ", ";
        dateStr += date.toLocaleDateString() + " " + date.toLocaleTimeString()
        return dateStr;
    }
};

var expenseTable = {
    build: function(expenses) {
        var table = $('#expense-table-body');
        table.html('');
        for (var expenseId in expenses) {
            if (expenses.hasOwnProperty(expenseId)) {
                this.insertTableRow(expenses[expenseId]);
            }
        }
    },
    // Amount, desc, tag, date, buyer
    insertTableRow: function(expense) {
        var table = $('#expense-table-body');
        var html = '<tr>';
        html += '<td>$' + expense.amount / 100 + '</td>';
        html += '<td>' + expense.description + '</td>';
        html += '<td>' + expense.tag + '</td>';
        html += '<td>' + utils.prettyDate(expense["purchase_date"]) + '</td>';
        html += '<td>' + expense.purchaser + '</td>';
        table.append(html);
    }
}

var tagCollection = {
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
                this.insertItem(tag);
            }
        }
    },

    insertItem: function(tag) {
        var value = '$' + (tag.value / 100)
        var checkboxId = 'filter-' + tag.name;
        html = '<li class="collection-item avatar">';
        html += '<i class="material-icons circle">' + tag.icon + '</i>';
        html += '<span class="title">' + tag.name + '</span>';
        html += '<p>' + value + '</p>';
        html += ' <a href="#!" class="secondary-content">';
        html += '<input type="checkbox" class="filled-in" checked="checked" id="' + checkboxId + '">';
        html += '<label for="' + checkboxId + '">Show</label>';
        html += '</a></li>';

        $('#tag-collection').append(html);
        handlers.createTagFilterHandler(checkboxId);
    }
}

app.initialize();
