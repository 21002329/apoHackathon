// fino API

var user_email = "avaloq1@fino.digital";
var user_password = "Demo1234!";
var redirect_uri = "";
var fino_base_url = "https://blacklayer.test.fino.cloud/api/fino";
var fino_client_id = "fino_api";
var fino_client_secret = "e105fb2a-bc75-4c5f-b7d7-3ca7270d90da";
var fino_access_token = "";
var fino_refresh_token = "";
var fino_refresh_interval_seconds = 15;
var fino_bank_code = "10020000";
var fino_bank_secret = "demoaccount1";
var fino_bank_username = "demoaccount";

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

function finoConnectBankAccountCallback(data, status) {
    console.log("Connect bank account status: " + status);
    finoGetBankAccounts();
};

function printBankAccounts(data) {
    console.log("Bank Accounts:");
    var accounts = data.data.accounts
    for (var ind in accounts) {
        console.log("accountId: " + accounts[ind].accountId);
    }
}

function finoGetBankAccountsCallBack(data, status) {
    printBankAccounts(data);
}

function finoClearCallback(data, status) {
    console.log("Clear status: " + status);
};


function finoPost(url, data, callback, withAuthorization) {
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
        success: callback
    });
};

function finoGet(url, data, callback, withAuthorization) {
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
        success: callback
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

    finoPost(url, data, finoRegisterCallback);
};

function finoLogin() {
    var data = {
        "email": user_email,
        "password": user_password,
    };

    var url = fino_base_url + "/auth";

    finoPost(url, data, finoLoginCallback);
};

function finoRefreshToken() {
    var data = {
        "refreshToken": fino_refresh_token
    }

    var url = fino_base_url + "/auth/refresh";

    finoPost(url, data, finoRefreshCallback);
};

function finoClear() {
    var data = {
        "password": user_password
    }

    var url = fino_base_url + "/user/clear";

    finoPost(url, data, finoClearCallback, true);
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

    finoPost(url, data, finoConnectBankAccountCallback, true);
};

function finoGetBankAccounts() {
    var url = fino_base_url + "/user/connector/bank/account";

    finoGet(url, null, finoGetBankAccountsCallBack, true);
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
        isSpending = false;
        isFixed = false;
        matchedCategory = "";
        trx = transactions[i];
        amount = trx.amount;
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
        if (isFixed) {
            pushOrAdd(overview[type], "fixed", amount);
        } else {
            pushOrAdd(overview[type], "non-fixed", amount);
        }
    }
    console.log(JSON.stringify(overview));
    return overview;
}

async function finoRefresh() {
    while (true) {
        await sleep(fino_refresh_interval_seconds * 1000);
        finoRefreshToken();
    }
};

finoRefresh();