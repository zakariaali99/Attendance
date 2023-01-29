let users_traffic = [];

function request(url, response) {
    $.ajax(url, {
        success: (data) => {
            response(data);
        }
    });
}


function load(url, responseListener, progress, added_query = "") {

    $.ajax(url, {
        success: (data) => {
            let usersPerPage = 1000;
            // let users_url = "/api/reports/sas";
            let first_users_url = `${url}?page=1&count=${usersPerPage}` + added_query;
            $.ajax(first_users_url, {
                success: (data) => {
                    let buffer_data = [];
                    let pages = data.last_page;

                    async function f() {
                        let finished = 0;
                        for (let i = 1; i <= pages; i++) {
                            // let url = `${url}?page=${i}&count=${usersPerPage}` + added_query;
                            $.ajax(`${url}?page=${i}&count=${usersPerPage}` + added_query, {
                                success: (data) => {

                                    finished += 1;
                                    buffer_data.push(...data.data);
                                    // updateProgress("loadingProgress", finished, pages);
                                    if (typeof progress !== typeof undefined) {
                                        progress(finished, pages)
                                    }
                                    if (finished >= pages) {
                                        responseListener(buffer_data);
                                    }
                                }
                            });
                        }
                    }

                    f();
                }
            });
            responseListener(data);
        }
    })
}


function load_activations(from_date, to_date, prefix, responseListener) {
    const users_url = `/api/reports/activations?from=${from_date}&to=${to_date}&prefix=${prefix}`;
    request(users_url, responseListener);
    // load(users_url, responseListener, progress)
}

function load_summary_activations(from_date, to_date, prefix, responseListener) {
    const users_url = `/api/reports/activations_all?from=${from_date}&to=${to_date}&prefix=${prefix}`;
    request(users_url, responseListener);
    // load(users_url, responseListener, progress)
}

function load_user_traffic(user_id, responseListener) {
    const users_url = `/api/reports/traffic?user_id=${user_id}&month=9`;
    request(users_url, responseListener);
}

function load_serieses(responseListener) {
    const users_url = `/api/reports/groups`;
    request(users_url, responseListener);
}

function load_series_cards(from, to, prefix, search, value, page, responseListener) {
    const users_url = `/api/reports/cards?from=${from}&to=${to}&prefix=${prefix}&page=${page}&value=${value}&search=${search}`;
    request(users_url, responseListener);
}

function load_all_user_traffic(users, update, finish) {
    let users_data = [];
    let max = users.length;
    let current = 0;
    const url = `/api/reports/traffic`;
    let ids = users.map((item, i) => {
        return item.id
    });
    // for(let user of users){
    //     load_user_traffic(user.id,(data)=>{
    //         users_data.push(data);
    //         current+=1;
    //         update(current, max);
    //         if (current >= max){
    //             finish(users_data);
    //         }
    //     });
    // }
    console.log(ids);
    let token = $("input[name=csrfmiddlewaretoken]").val();
    $.ajax(url, {
        method: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            "users": ids,
            "csrfmiddlewaretoken": token,
            "month": 9
        }),
        beforeSend: function(xhr, settings) {
            xhr.setRequestHeader("X-CSRFToken", token);
        },
        success: (data) => {
            finish(data);
        }
    });

}



function load_reports(page, responseListener) {
    const users_url = "/api/reports/report?page=" + page;
    // let progress = (current, end) => {
    //     console.log(current, end);
    // };
    request(users_url, responseListener);
    // load(users_url, responseListener, progress)
}


function load_used_cards_summary(from_date, to_date, prefix, responseListener) {
    const users_url = `/api/reports/used_cards?from=${from_date}&to=${to_date}&prefix=${prefix}`;
    request(users_url, responseListener);
}