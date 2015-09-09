function FirebaseClient(url) {
    this.baseURL = url;
    this.tagsRef = new Firebase(this.baseURL + "tags");
    this.expensesRef = new Firebase(this.baseURL + "expenses");
}

FirebaseClient.prototype.initEventHandlers = function() {
    this.expensesRef.limitToLast(1).orderByChild("purchase_date")
        .on("child_added", function(snapshot) {
            data = snapshot.val();
            console.log(data);
            data = formatFBDataByTag(data);
            pieChart.update(data);
            app.updateTotal(data);
        });
}

FirebaseClient.prototype.getTags = function(callback) {
    this.tagsRef.on("value", function(snapshot) {
        callback(snapshot.val());
    }, function(error) {
        console.log("The read failed: " + error.code);
        callback([]);
    });
}

FirebaseClient.prototype.getExpensesByMonth = function(month, callback) {
    var startTime = new Date(2015, month, 1).getTime() / 1000;
    var endTime = new Date(2015, month + 1, 0).getTime() / 1000;

    this.expensesRef.orderByChild("purchase_date")
        .startAt(startTime)
        .endAt(endTime)
        .on("value", function(snapshot) {
                callback(snapshot.val());
            },
            function(error) {
                console.log("The read failed: " + error.code);
                callback([]);
            });

}

FirebaseClient.prototype.getMonthlyExpensesByPurchaser = function(purchaser, callback) {
    var month = app.currentMonth;
    var startTime = new Date(2015, month, 1).getTime() / 1000;
    var endTime = new Date(2015, month + 1, 0).getTime() / 1000;

    this.expensesRef.orderByChild("purchase_date")
        .equalTo("purchaser", purchaser)
        .startAt(startTime)
        .endAt(endTime)
        .on("value", function(snapshot) {
            callback(snapshot.val());
        }, function(error) {
            console.log("The read failed: " + error.code);
            callback([]);
        });
}

FirebaseClient.prototype.getMonthlyExpensesByTag = function(tagName, callback) {
    var month = app.currentMonth;
    var startTime = new Date(2015, month, 1).getTime() / 1000;
    var endTime = new Date(2015, month + 1, 0).getTime() / 1000;
    tagName = tagName.toLowerCase()
    var tagArray = []

    this.expensesRef.orderByChild("purchase_date")
        .startAt(startTime)
        .endAt(endTime)
        .on("value", function(snapshot) {
            var expenses = snapshot.val();
            for (var expense in expenses) {
                if (expenses.hasOwnProperty(expense)) {
                    var expenseData = expenses[expense];
                    if (expenseData.tag == tagName)
                        tagArray.push(expenseData)
                }
            }
            callback(tagArray);
        }, function(error) {
            console.log("The read failed: " + error.code);
            callback([]);
        });
}

FirebaseClient.prototype.getAllExpenses = function(callback) {
    this.expensesRef.orderByChild("purchase_date")
        .on("value", function(snapshot) {
            callback(snapshot.val());
        }, function(error) {
            console.log("The read failed: " + error.code);
            callback([]);
        });
}
