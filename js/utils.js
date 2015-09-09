var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function getCurrentMonthInt() {
    d = new Date();
    return d.getMonth()
}

function moneyFormat(n) {
    var c = 2
    var d = "."
    var t = ",";

    s = n < 0 ? "-$" : "$",
        i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}

function calculateTotal(expenses) {
    var total = 0;
    for (var expenseId in expenses) {
        if (expenses.hasOwnProperty(expenseId)) {
            var expenseObj = expenses[expenseId];
            total += expenseObj.amount;
        }
    }
    return total;
}

function tagJsonToArray(tagsObj) {
    tagsArray = [];
    for (var key in tagsObj) {
        if (tagsObj.hasOwnProperty(key)) {
            tagsArray.push(key);
        }
    }
    return tagsArray;
}

function formatFBDataByTag(expenses) {
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
}

function formatFBDataByDay(expenses) {
    var dataByTag = {};
    for (var expenseId in expenses) {
        if (expenses.hasOwnProperty(expenseId)) {
            var expenseObj = expenses[expenseId];
            var tagName = expenseObj.tag;

            if (!dataByTag.hasOwnProperty(tagName)) {
                dataByTag[tagName] = {}
                dataByTag[tagName].purchases = [];

            }

            var day = getDayByEpoch(expenseObj["purchase_date"]);
            var noPurchaseThisDay = true;
            for (var i = 0; i < dataByTag[tagName].purchases.length; i++) {
                if (dataByTag[tagName].purchases[i][0] == day) {
                    dataByTag[tagName].purchases[i][1] += expenseObj.amount / 100;
                    noPurchaseThisDay = false;

                }
            }
            if (noPurchaseThisDay) {
                var purchase = [];
                purchase.push(day);
                purchase.push(expenseObj.amount / 100);
                dataByTag[tagName].purchases.push(purchase);
            }
        }
    }

    // now format it all as a giant array
    var data = [];
    for (var tagName in dataByTag) {
        if (dataByTag.hasOwnProperty(tagName)) {
            var dataItem = {};
            var tag = dataByTag[tagName];
            dataItem.tagName = tagName;
            dataItem.purchases = tag.purchases;
            dataItem.total = tag.purchases.length;
            data.push(dataItem);
        }
    }
    return data;
}

function getDayByEpoch(epoch) {
    epoch = parseInt(epoch) * 1000;
    var date = new Date(epoch);
    date.setTime(date.getTime() + date.getTimezoneOffset());
    return date.getDay();
}

function prettyDate(epoch) {
    epoch = parseInt(epoch) * 1000;
    date = new Date(epoch);
    dateStr = '';
    dateStr += days[date.getDay()] + ", ";
    dateStr += date.toLocaleDateString() + " " + date.toLocaleTimeString()
    return dateStr;
}
