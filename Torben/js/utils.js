// fino API

var user_email = "avaloq122@fino.digital";
var user_password = "Demo1234!";
var redirect_uri = "";
var fino_base_url = "https://blacklayer.test.fino.cloud/api/fino";
var fino_client_id = "fino_api";
var fino_client_secret = "e105fb2a-bc75-4c5f-b7d7-3ca7270d90da";
var fino_access_token = "";
var fino_refresh_token = "";
var fino_refresh_interval_seconds = 15;
var fino_bank_code = "10020000";
var fino_bank_secret = "test";
var fino_bank_username = "apoHackathon1";
var account = {};
var balanceWithForecast = {};

// ..

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var finoAddHeaders = function(req) {
    req.setRequestHeader("X-FINO-ClientID", fino_client_id);
    req.setRequestHeader("X-FINO-ClientSecret", fino_client_secret);
};

var finoAddHeadersWithAuthorization = function(req) {
    req.setRequestHeader("X-FINO-ClientID", fino_client_id);
    req.setRequestHeader("X-FINO-ClientSecret", fino_client_secret);
    req.setRequestHeader("X-FINO-ClientSecret", fino_client_secret);
    req.setRequestHeader("X-FINO-Authorization", "Bearer " + fino_access_token);
};

function finoRegisterCallback(data, status) {
    console.log("Register status: " + status);
    console.log("Logging in...");
    finoLogin();
};

function finoLoginCallback(data, status) {
    console.log("Login status: " + status);
    console.log("Connecting to bank account...");
    fino_access_token = data["data"]["accessToken"];
    fino_refresh_token = data["data"]["refreshToken"];
    finoConnectBankAccount();
};

function finoRefreshCallback(data, status) {
    console.log("Refresh status: " + status);
    fino_access_token = data["data"]["accessToken"];
};

function finoRefreshErrorCallback(xhr, status, err) {
    console.log("Refresh failed: " + status.message);
    console.log("Trying to log-in again...");
    finoLogin();
};

function finoConnectBankAccountCallback(data, status) {
    console.log("Connect bank account status: " + status);
    finoGetBankAccounts();
    finoGetForecast();
};

function printBankAccounts(data) {
    console.log("Bank Accounts:");
    var accounts = data.data.accounts
};

function finoGetBankAccountsCallBack(data, status) {
    console.log("Get bank accounts status: " + status);
    printBankAccounts(data);
    account = data.data.accounts[0];
    console.log("Account set: " + account.accountId);
};

function finoGetForecastCallBack(data, status) {
    console.log("Get forecast: " + status);
    balanceWithForecast = data.data.forecast;
}

function finoClearCallback(data, status) {
    console.log("Clear status: " + status);
};


function finoPost(url, data, callback, errorCallback, withAuthorization) {
    var addHeaders;
    if (withAuthorization) {
        addHeaders = finoAddHeadersWithAuthorization;
    } else {
        addHeaders = finoAddHeaders;
    }

    $.ajax({
        beforeSend: addHeaders,
        type: "POST",
        url: url,
        processData: false,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: callback,
        error: errorCallback,
        async: false
    });
};

function finoGet(url, data, callback, errorCallback, withAuthorization) {
    var addHeaders;
    if (withAuthorization) {
        addHeaders = finoAddHeadersWithAuthorization;
    } else {
        addHeaders = finoAddHeaders;
    }
    $.ajax({
        beforeSend: addHeaders,
        type: "GET",
        url: url,
        processData: false,
        data: JSON.stringify(data),
        contentType: "application/json",
        success: callback,
        error: errorCallback,
        async: false
    });
};

function finoRegister() {
    var data = {
        "email": user_email,
        "password": user_password,
        "repeatPassword": user_password,
        "redirect_uri": redirect_uri
    };

    var url = fino_base_url + "/users";

    finoPost(url, data, finoRegisterCallback, null, false);
};

function finoLogin() {
    var data = {
        "email": user_email,
        "password": user_password,
    };

    var url = fino_base_url + "/auth";

    finoPost(url, data, finoLoginCallback, null, false);
};

function finoRefreshToken() {
    var data = {
        "refreshToken": fino_refresh_token
    }

    var url = fino_base_url + "/auth/refresh";

    finoPost(url, data, finoRefreshCallback, finoRefreshErrorCallback, false);
};

function finoClear() {
    var data = {
        "password": user_password
    }

    var url = fino_base_url + "/user/clear";

    finoPost(url, data, finoClearCallback, null, true);
}

function finoConnectBankAccount() {
    var data = {
        "bankCode": fino_bank_code,
        "extraSecret": "",
        "saveSecret": true,
        "secret": fino_bank_secret,
        "username": fino_bank_username
    }

    var url = fino_base_url + "/user/connector/bank/account";

    finoPost(url, data, finoConnectBankAccountCallback, finoConnectBankAccountCallback, true);
};

function finoGetBankAccounts() {
    var url = fino_base_url + "/user/connector/bank/account";

    finoGet(url, null, finoGetBankAccountsCallBack, null, true);
}

function finoGetForecast() {
    var url = fino_base_url + "/user/intelligence/forecast";

    finoGet(url, null, finoGetForecastCallBack, null, true);
}

function pushOrAdd(obj, key, val) {
    // push
    if(obj[key] == null) {
        obj[key] = val;
    // add
    } else {
        obj[key] += val;
    }
}

function getTransactionOverview(transactions) {
    var overview = {
        spending: {
            amount: 0
        },
        earning: {
            amount: 0
        }
    };
    var spendingCategories = [
        "insurance",
        "financing",
        "rental",
        "travel",
        "money investment",
        "health"
    ];

    var earningCategories = [
        "rental income",
        "salary",
        "capital assets"
    ]

    var trx;
    var tag = "";
    var type;
    var isFixed;
    var matchedCategory;
    var amount = 0;
    for (var i in transactions) {
        if (transactions[i].bookingDate < moment("2019-05-01", "YYYY-MM-DD").valueOf()/1000) {
            continue;
        }

        isSpending = false;
        isFixed = false;
        matchedCategory = "";
        trx = transactions[i];
        amount = Math.abs(Number(trx.amount));
        // Check spending / earning
        if (trx.tags.includes("spending")) {
            type = "spending";
        } else {
            type = "earning";
        }
        // Add amount
        overview[type].amount += amount;
        // Check other tags
        for (var k in trx.tags) {
            tag = trx.tags[k];
            if (spendingCategories.includes(tag) || earningCategories.includes(tag)) {
                matchedCategory = tag;
            }
            if (tag == "fix") {
                isFixed = true;
            }
        }
        if (matchedCategory != "") {
            pushOrAdd(overview[type], matchedCategory, amount);
        } else {
            pushOrAdd(overview[type], "others", amount);
        }
    }
    return overview;
}

function getSpendingsPieChartData() {

    var spending = getTransactionOverview(account.transactions).spending;
    var properties = Object.getOwnPropertyNames(spending);
    var totalSpending = spending.amount;

    var data = {
        values: [],
        labels: [],
        type: 'pie',
        hoverinfo: 'label+name',
        textinfo: 'percent'
    }

    for(var p in properties) {
        if (properties[p] != "amount") {
            data.labels.push(properties[p]);
            data.values.push((spending[properties[p]] / totalSpending) * 100);
        }
    }
    return data;
}


function getSpendingsExpensenTable() {

    var spending = getTransactionOverview(account.transactions).spending;
    var properties = Object.getOwnPropertyNames(spending);
    console.log(properties.toString());

    var totalSpending = spending.amount;

    var data = {
        values: [],
        labels: [],
        type: 'pie',
        hoverinfo: 'label+name',
        textinfo: 'percent'
    }

    for(var p in properties) {
        if (properties[p] != "amount") {
            data.labels.push(properties[p]);
            data.values.push((spending[properties[p]]));
        }
    }

    console.log(JSON.stringify(data));

    return data;
}

function getAccountBalancePlotData() {
    var data = [];
    var t;
    var y;

    for(i in balanceWithForecast) {
        y = Number(balanceWithForecast[i].value);
        t = moment(balanceWithForecast[i].date, "YYYY-MM-DD").valueOf();
        data.push({
            t: t,
            y: y
        });
    }
    return data;
}

async function finoRefresh() {
    while (true) {
        await sleep(fino_refresh_interval_seconds * 1000);
        finoRefreshToken();
    }
};

finoRefresh();
