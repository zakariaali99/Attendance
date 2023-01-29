
let ticket_status = new Map()
ticket_status.set("0", "المفتوحة");
ticket_status.set("1", "المنجزة");
ticket_status.set("2", "غير المنجزة");
ticket_status.set("3", "المتابعة");
ticket_status.set("4", "الكل");



let sort_by = new Map()
sort_by.set("place", "المكان");
sort_by.set("fixer", "المكلف");
sort_by.set("ticket_open_info__sector_name", "البرج");
sort_by.set("name", "الاسم");
sort_by.set("account", "الحساب");
sort_by.set("problem", "المشكلة");


let problems = [];
let solutions = [];
let notifications = [];
let employees = [];
let towers = [];
let cities = [];
let sectors = [];


function randomColor() {
    return "#" + ((1 << 24) * Math.random() | 0).toString(16);
}


class DeleteTicket extends React.Component {

    constructor(props) {
        super(props);
        if (props.ticket != null && typeof props.ticket != typeof undefined)
            this.state = {
                ticket: props.ticket,
                name: props.ticket.name,
                account: props.ticket.account,
                phone: props.ticket.phone,
                place: props.ticket.place,
                problem: props.ticket.problem,
                solution: props.ticket.solution,
                sector: props.ticket.sector,
                city: props.ticket.city,
                note: props.ticket.note,
                fixed_by: props.ticket.fixed_by,
                close_state: props.ticket.close_state,
                solutions: props.ticket.solutions,
                comments: []
            }
        else
            this.state = {
                ticket: null,
                name: "",
                account: "",
                phone: "",
                place: "",
                problem: [],
                solution: "",
                sector: null,
                city: null,
                note: "",
                fixer: "",
                close_state: '0',
                comments: [],
                solutions: [],

            }
        console.log(this.state)
    }

    submit = (e) => {
        e.preventDefault();
        console.log(this.props.ticket)
        let view = this;
        var url = `/api/ticket/${view.props.ticket.id}/close`;
        var method = "POST"


        let token = $("input[name=csrfmiddlewaretoken]").val();
        $.ajax(url, {
            method: method,
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", token);
            },
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                name: this.state.name,
                account: this.state.account,
                phone: this.state.phone,
                place: this.state.place,
                problem: this.state.problem,
                solution: this.state.solution,
                sector: this.state.sector,
                city: this.state.city,
                note: this.state.note,
                solutions: this.state.solutions,
                fixed_by: this.state.fixed_by,
                close_state: this.state.close_state,
                comments: []
            }),
            success: (res) => {
                console.log(res);
                view.props.success(res);
                view.props.hide();

            },
        });
    }



    delete = (e) => {
        e.preventDefault();
        let view = this;
        let token = $("input[name=csrfmiddlewaretoken]").val();
        jQuery.ajax({
            url: "/ticket/delete/" + view.props.ticket.id,
            type: "GET",
            cache: false,
            success: (res) => {
                view.props.success(view.props.ticket);
                view.props.hide();
            },
            fail: (error) => {
                console.log(error)
            }
        });
    }

    event = (type) => e => {
        let v = e.target.value;
        let s = this.state;
        s[type] = v;
        this.setState(s);
    }


    render() {
        return <div className="over-layer show" id="dialog" style={{ "display": "block" }}>
            <div onClick={(e) => this.props.hide()} className="over-layer show" id="dialog" style={{ "display": "block" }}></div>
            <div className="content">
                <div className="header">
                    <div onClick={(e) => this.props.hide()} id="closeDeleteDialog" class="btn btn-close"></div>
                </div>
                <div className="body text-center">
                    <p className="text-danger">هل تريد بالتاكيد حذف هذه التذكرة؟</p>
                    <p id="deleteTitle" className="text-danger">{this.props.ticket.account} - {this.props.ticket.name}</p>
                    <button onClick={this.delete} id="deleteTicket" type="button" className="btn btn-danger">حذف</button>
                </div>
            </div>

        </div>
    }
}
class CloseTicket extends React.Component {

    constructor(props) {
        super(props);
        if (props.ticket != null && typeof props.ticket != typeof undefined)
            this.state = {
                ticket: props.ticket,
                name: props.ticket.name,
                account: props.ticket.account,
                phone: props.ticket.phone,
                place: props.ticket.place,
                problem: props.ticket.problem,
                solution: props.ticket.solution,
                notifications: props.ticket.notifications,
                sector: props.ticket.sector,
                city: props.ticket.city,
                note: props.ticket.note,
                fixed_by: props.ticket.fixed_by,
                close_state: props.ticket.close_state,
                solutions: props.ticket.solutions,
                comments: []
            }
        else
            this.state = {
                ticket: null,
                name: "",
                account: "",
                phone: "",
                place: "",
                problem: [],
                solution: "",
                sector: null,
                city: null,
                note: "",
                fixer: "",
                close_state: '0',
                comments: [],
                solutions: [],
                notifications: [],

            }
        console.log(this.state)
    }

    submit = (e) => {
        e.preventDefault();
        
        let view = this;
        var url = `/api/ticket/${view.props.ticket.id}/close`;
        var method = "POST"


        let token = $("input[name=csrfmiddlewaretoken]").val();
        $.ajax(url, {
            method: method,
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", token);
            },
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                name: this.state.name,
                account: this.state.account,
                phone: this.state.phone,
                place: this.state.place,
                problem: this.state.problem,
                solution: this.state.solution,
                sector: this.state.sector,
                city: this.state.city,
                note: this.state.note,
                solutions: this.state.solutions,
                notifications: this.state.notifications,
                fixed_by: this.state.fixed_by,
                close_state: this.state.close_state,
                comments: []
            }),
            success: (res) => {
                console.log(res);
                view.props.success(res);
                view.props.hide();

            },
        });
    }


    componentDidMount() {
        this.loadComments();

    }


    submitUpdate = (e) => {
        e.preventDefault();
        
        let view = this;
        var url = `/api/ticket/update`;
        var method = "POST"

        if (this.state.comment.length <= 2)
            return

        let token = $("input[name=csrfmiddlewaretoken]").val();
        $.ajax(url, {
            method: method,
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", token);
            },
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                ticket: this.props.ticket.id,
                comment: this.state.comment,
            }),
            success: (res) => {
                console.log(res);
                let items = [...this.state.comments, res];
                view.setState({
                    comments: items,
                })
                // view.props.success(res)
            },
        });
    }

    event = (type) => e => {
        let v = e.target.value;
        let s = this.state;
        s[type] = v;
        this.setState(s);
    }


    onSelect = (type) => e => {
        let v = Number(e.target.value);
        let s = this.state;
        let idx = s[type].findIndex((it, idx) => v == it)
        if (idx == -1)
            s[type].push(v)
        else s[type] = s[type].filter((it) => it != v)
        // s[type] = v;
        this.setState(s);
    }


    loadComments = () => {
        $.ajax(`/api/ticket/comments/${this.state.ticket.id}/list`, {
            success: (res) => {
                let items = res.results;
                this.setState({
                    comments: items,
                });
            },
        });
    }


    render() {
        let can_add_notification = (userinfo.user_permissions.find((v)=>v.codename == "view_ticketnotification") != null);//


        return <div className="over-layer show" id="dialog" style={{ "display": "block" }}>
            <div onClick={(e) => this.props.hide()} className="over-layer show" id="dialog" style={{ "display": "block" }}></div>
            <div className="content">
                <div className="header">
                    <button id="closeDialog" onClick={(e) => this.props.hide()} className="btn btn-close"></button>
                </div>
                <div className="body">
                    <div className="row text-center">
                        <strong id="closeTitle" className="text-success w-100">{this.props.ticket.id} -  - {this.props.ticket.account} - {this.props.ticket.phone}</strong>
                    </div>
                    <div className="container">
                        <div className="row">
                            <div className="col"></div>
                            <div className="col-12">

                                <form method="post" id="close_ticket_form" onSubmit={this.submit}>
                                    
                                    <div className="container">
                                        <div className="row">

                                            <div className="col-6">
                                                <div className="mb-3">
                                                    <label for="id_fixed_by" className="form-label">المكلف بها</label>
                                                    <select disabled={!(userinfo.user_permissions.find((v)=>v.codename == "can_edit_ticket_fixer") != null)} onChange={this.event("fixed_by")} name="fixed_by" className="form-control rounded-pill" required="" id="id_fixed_by">
                                                        <option value="">---------</option>
                                                        {this.props.employees.map((emp, idx) => <option value={emp.id} selected={emp.id == this.state.fixed_by}>{emp.name}</option>)}
                                                    </select>

                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="mb-3">
                                                    <label for="exampleInputEmail1" className="form-label">البرج</label>
                                                    <input type="text" value={this.state.sector} onChange={this.event("sector")} name="tower" className="form-control rounded-pill" id="id_tower" />
                                                </div>
                                            </div>

                                            <div className={can_add_notification ? "col-4" : "col-6"}>
                                                <div className="mb-3  bg-light" style={{ "max-height": "200px", "overflow": "scroll", }}>
                                                    <label for="exampleInputEmail1" className="form-label">المشكلة</label>
                                                    {problems.map((v) => <div><input checked={this.state.problem.includes(v.id)} onChange={this.onSelect("problem")} className="form-check-input" name="problem" type="checkbox" value={v.id} /> {v.name}</div>)}
                                                </div>
                                            </div>
                                            <div className={can_add_notification ? "col-4" : "col-6"}>
                                                <div className="mb-3 bg-light" style={{ "max-height": "200px", "overflow": "scroll", }}>
                                                    <label for="exampleInputEmail1" className="form-label">الحل</label>
                                                    {solutions.map((v) => <div><input checked={this.state.solutions.includes(v.id)} onChange={this.onSelect("solutions")} className="form-check-input" name="solutions" type="checkbox" value={v.id} /> {v.solution}</div>)}
                                                </div>
                                            </div>
                                            {can_add_notification?
                                            <div className="col-4">
                                                <div className="mb-3 bg-light border border-warning" style={{ "max-height": "200px", "overflow": "scroll", }}>
                                                    <label for="exampleInputEmail1" className="form-label">التنبيهات</label>
                                                    {notifications.map((v) => <div><input checked={this.state.notifications.includes(v.id)} onChange={this.onSelect("notifications")} className="form-check-input" name="solutions" type="checkbox" value={v.id} /> {v.text}</div>)}
                                                </div>
                                            </div>:""}
                                            <div className="col-6">
                                                <div className="mb-3">
                                                    <label for="exampleInputEmail1" className="form-label">ملاحظات</label>
                                                    <input type="text" value={this.state.note} onChange={this.event("note")} name="note" className="form-control rounded-pill" id="id_note" />
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="mb-3">
                                                    <label for="exampleInputEmail1" className="form-label">حالة الاغلاق</label>
                                                    <select onChange={this.event("close_state")} name="state" className="form-control rounded-pill" id="id_state">
                                                        {[...ticket_status.entries()].map((v, idx) => <option selected={this.state.close_state == v[0]} value={v[0]} >{v[1]}</option>)}
                                                    </select>
                                                </div>
                                            </div>



                                            <div className="col"></div>
                                            <div className="col-3 my-3">
                                                <button id="#close_ticket" type="submit" className="btn btn-primary w-100 rounded-pill">حفظ</button>
                                            </div>
                                            <div className="col"></div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="col"></div>
                            {this.state.comments.length > 0 ? <hr /> : ""}
                            {this.state.comments.map((v, idx) => <div className="col-12">
                                <div className="row ">
                                    <div className={`bg-light  shadow-none mt-1 rounded p-2`}>
                                        <div className="row">
                                            <div className="col-12">
                                                {v.comment}
                                            </div>
                                            <div className="col-auto text-muted">
                                                {v.created_at}
                                            </div>
                                            <div className="col"></div>
                                            <div className="col-auto  text-muted">
                                                {v.created_by != null ? v.created_by.name : ""}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>)}
                            <hr />
                            <div className="col-12">
                                <form method="POST" onSubmit={this.submitUpdate}>
                                    <textarea onChange={this.event("comment")} value={this.state.comment} name="solution" className="form-control rounded" rows="5" id="id_solution"></textarea>
                                    <div className="col-2 my-3">
                                        <button type="submit" className="btn btn-primary w-100 rounded-pill">اضافة</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    }
}

class HistoryOfTicket extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ticket: props.ticket,
            name: props.ticket.name,
            account: props.ticket.account,
            phone: props.ticket.phone,
            place: props.ticket.place,
            problem: props.ticket.problem,
            solution: props.ticket.solution,
            sector: props.ticket.sector,
            city: props.ticket.city,
            note: props.ticket.note,
            fixer: props.ticket.fixer,
            close_state: props.ticket.close_state,
            items: []
        }


    }




    componentDidMount() {
        this.loadTickets();

    }




    event = (type) => e => {
        let v = e.target.value;
        let s = this.state;
        s[type] = v;
        this.setState(s);
    }

    loadTickets = () => {
        $.ajax(`/api/ticket/list?q=${this.state.ticket.account}&state=4`, {
            success: (res) => {
                let items = res.results;

                this.setState({
                    items: items,

                });
            },
        });
    }


    render() {
        return <div className="over-layer show" id="dialog" style={{ "display": "block" }}>
            <div onClick={(e) => this.props.hide()} className="over-layer show" id="dialog" style={{ "display": "block" }}></div>
            <div className="content">
                <div className="header">
                    <button id="closeDialog" onClick={(e) => this.props.hide()} className="btn btn-close"></button>
                </div>
                <div className="body">
                    <div className="row text-center">
                        <strong id="closeTitle" className="text-success w-100">{this.props.ticket.id} -  - {this.props.ticket.account} - {this.props.ticket.phone}</strong>
                    </div>
                    <div className="container">
                        {this.state.items.map((ticket, idx) =>
                            <div className="row px-2" id="ticket-">
                                <div className={`bg-light ${ticket.close_state == "1" ? "text-success" : ""} ${ticket.close_state == "2" ? "text-danger" : ""} ${ticket.close_state == "3" ? "text-info" : ""} shadow-none mt-1 rounded py-2`}>
                                    <div className="row">
                                        <div id="ticket-id-" className="col-2">
                                            <div> {ticket.created_at} </div>
                                            <div> {ticket.opened_by ? ticket.opened_by.name : ""}</div>
                                        </div>
                                        <div className="col">
                                            <div id="ticket-account-"> {ticket.account} </div>
                                            <div id="ticket-name-">{ticket.name}</div>
                                        </div>
                                        <div id="ticket-phone-" className="col-1"> {ticket.phone}</div>
                                        <div id="ticket-place-container-" className="col-1 d-none d-md-block">
                                            <div id="ticket-account-"> {ticket.city} </div>
                                            <div id="ticket-place-">{ticket.place} </div>

                                        </div>
                                        <div id="ticket-problem-" className="col-1 d-none d-md-block p-0">

                                        </div>

                                        <div className="col-2 p-0 d-none d-md-block">
                                            <div >
                                                <select disabled={true} onChange={this.event("state")} name="state" className="form-control rounded-pill">
                                                    <option value="" >--</option>
                                                    {this.props.employees.map((emp, idx) => <option value={emp.id} selected={emp.id == ticket.fixed_by}>{emp.name}</option>)}
                                                </select>
                                            </div>

                                        </div>
                                        <div className="col-2 p-0 d-none d-md-block">
                                            {ticket.close_state == "1" ? ticket.solution : ticket.note}

                                        </div>

                                        <div className="col-1 d-none d-md-block p-0 m-0">
                                            <div className="w-100">
                                                {ticket.opened_1_month > 0 ? <span className="badge bg-danger">{ticket.opened_1_month}</span> : ""}
                                                {ticket.opened_3_month > 0 ? <span className="badge bg-warning">{ticket.opened_3_month}</span> : ""}
                                                {ticket.total_tickets > 0 ? <span className="badge bg-secondary">{ticket.total_tickets}</span> : ""}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    }
}

class DetailView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            socket: props.socket,
            details: null,
            loading: true,
            from: null,
            to: null,
            type: "temp",
            rangeView: 1,
        }

    }

    componentDidMount() {
        this.load(1);
    }

    load = (range) => {
        let socket = this.state.socket;
        var url = `/api/socket/${socket.id}/detail?range=${range}`;
        if (range == -1) {
            url = `/api/socket/${socket.id}/detail?from=${this.state.from}&to=${this.state.to}`
        }
        $.ajax(url, {
            success: (res) => {
                let items = res.status;
                console.log(items, res)
                this.setState({
                    details: items,
                    loading: false,
                });
            },
        });
    }


    removeItem = (e) => {

        this.props.onDelete();
    };

    selectType = (e) => {
        let v = e.target.value;
        this.setState({
            type: v
        });
    };
    selectFromDate = (e) => {
        let v = e.target.value;
        this.setState({
            from: v
        });
        if (this.state.type == -1)
            this.load(-1)
    };
    selectToDate = (e) => {
        let v = e.target.value;

        this.setState({
            to: v
        });
        if (this.state.type == -1)
            this.load(-1)
    };
    selectViewRange = (range) => {

        this.setState({
            rangeView: range,
            loading: true
        });
        setTimeout(() => {
            this.load(range);
        }, 500);

    };

    render() {


        return (
            <div className={"over-layer show"} id="externalDataScreen">
                <div className={"over-layer show"} onClick={this.props.hide} />
                <div className='content bg-white' style={{ "width": "100%", "left": 0 }}>
                    <div className="row mb-2">
                        <div className="col" />
                        <div className="col-auto">
                            <button className="btn" onClick={this.props.hide}>X</button>
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col">
                            <p>Type</p>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" checked={this.state.type == "temp"} type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio1" value="temperature" />
                                <label className="form-check-label" for="inlineRadio1">Temperature</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio2" value="voltage" />
                                <label className="form-check-label" for="inlineRadio2">voltage</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio3" value="current" />
                                <label className="form-check-label" for="inlineRadio3">current</label>
                            </div>

                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio3" value="txPower" />
                                <label className="form-check-label" for="inlineRadio3">txPower</label>
                            </div>

                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio3" value="rxPower" />
                                <label className="form-check-label" for="inlineRadio3">rxPower</label>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <p className="p-0 m-0">Select peroid:</p>
                            {timeRanges.map((r, i) => {
                                return <div className="form-check form-check-inline">
                                    <input type="radio" onClick={(e) => { this.selectViewRange(r.value); }} checked={r.value == this.state.rangeView} id="customRadioInline1" name="range" className="form-check-input" value={r.value} />
                                    <label className="custom-control-label" htmlFor="customRadioInline1">{r.name}</label>
                                </div>;
                            })}

                        </div>
                        <div className="col-4">

                            <form>
                                <div className="row">
                                    <div className="form-group col-6">
                                        <label>From</label>
                                        <input type="date" value={this.state.from} onChange={this.selectFromDate} className="form-control" id="fromDate" placeholder="From" />
                                    </div>
                                    <div className="form-group col-6">
                                        <label>To</label>
                                        <input type="date" value={this.state.to} onChange={this.selectToDate} className="form-control" id="toDate" placeholder="To" />
                                    </div>
                                </div>
                            </form>

                        </div>
                    </div>
                    <div className="row ">
                        {!this.state.loading ?
                            <GraphView item={graphData} /> :
                            <div className="progress">
                                <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ "width": "100%" }} aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>}
                    </div>

                    <div className="row mb-2">

                    </div>
                </div>
            </div>
        );
    }
}


class AddDialogView extends React.Component {
    constructor(props) {
        super(props);
        if (props.ticket != null && typeof props.ticket != typeof undefined)
            this.state = {
                ticket: props.ticket,
                name: props.ticket.name,
                account: props.ticket.account,
                phone: props.ticket.phone,
                place: props.ticket.place,
                problem: props.ticket.problem,
                solutions: props.ticket.solutions,
                solution: props.ticket.solution,
                sector: props.ticket.sector,
                city: props.ticket.city,
                note: props.ticket.note,
                fixer: props.ticket.fixed_by,
            }
        else
            this.state = {
                ticket: null,
                name: "",
                account: "",
                phone: "",
                place: "",
                problem: [],
                solution: "",
                solutions: [],
                sector: null,
                city: null,
                note: "",
                fixer: "",

            }
        console.log(this.state)
    }

    submit = (e) => {
        e.preventDefault();
        console.log("prevented")
        let view = this;
        var url = `/api/ticket/add`;
        var method = "POST"
        if (view.props.ticket != null) {
            url = `/api/ticket/${view.props.ticket.id}/edit`
            method = "PUT"
        }

        let token = $("input[name=csrfmiddlewaretoken]").val();
        $.ajax(url, {
            method: method,
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("X-CSRFToken", token);
            },
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                name: this.state.name,
                account: this.state.account,
                phone: this.state.phone,
                place: this.state.place,
                problem: this.state.problem,
                solution: this.state.solution,
                solutions: this.state.solutions,
                sector: this.state.sector,
                city: this.state.city,
                note: this.state.note,
                fixed_by: this.state.fixer,
            }),
            success: (res) => {
                console.log(res);
                view.props.success(res)
            },
        });
    }
    event = (type) => e => {
        let v = e.target.value;
        let s = this.state;
        s[type] = v;
        this.setState(s);
    }


    onSelect = (type) => e => {
        let v = Number(e.target.value);
        let s = this.state;
        let idx = s[type].findIndex((it, idx) => v == it)
        if (idx == -1)
            s[type].push(v)
        else s[type] = s[type].filter((it) => it != v)
        // s[type] = v;
        this.setState(s);
    }



    render() {


        return (
            <div className={"over-layer show"} id="externalDataScreen">
                <div className={"over-layer show"} onClick={this.props.hide} />
                <div className='content bg-white'>
                    <form onSubmit={this.submit}>
                        <div className="container">
                            <div className="row">

                                <div className="col-8">
                                    <div className="mb-3">
                                        <label for="exampleInputEmail1" className="form-label">الاسم</label>
                                        <input value={this.state.name} required={true} onChange={this.event("name")} type="text" name="name" className="form-control rounded-pill" placeholder="الاسم" maxlength="2048" required id="id_name" />
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="mb-3">
                                        <label for="exampleInputEmail1" className="form-label">الحساب</label>
                                        <input value={this.state.account} required={true} onChange={this.event("account")} type="text" name="account" className="form-control rounded-pill" placeholder="الحساب" maxlength="1024" id="id_account" />
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="mb-3">
                                        <label for="exampleInputEmail1" className="form-label">الهاتف</label>
                                        <input value={this.state.phone} required={true} onChange={this.event("phone")} type="text" name="phone" rows="3" className="form-control rounded-pill" placeholder="رقم الهاتف" required maxlength="1024" id="id_phone" />
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="mb-3">
                                        <label for="exampleInputEmail1" className="form-label">المكان</label>
                                        <input value={this.state.place} required={true} onChange={this.event("place")} type="text" name="place" className="form-control rounded-pill" placeholder="المكان..." maxlength="1024" id="id_place" />
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="mb-3  bg-light" style={{ "max-height": "200px", "overflow": "scroll", }}>
                                        <label for="exampleInputEmail1" className="form-label">المشكلة</label>
                                        {problems.map((v) => <div><input checked={this.state.problem.includes(v.id)} onChange={this.onSelect("problem")} className="form-check-input" name="problem" type="checkbox" value={v.id} /> {v.name}</div>)}
                                    </div>
                                </div>

                                <div className="col-6">
                                    <div className="mb-3 bg-light" style={{ "max-height": "200px", "overflow": "scroll", }}>
                                        <label for="exampleInputEmail1" className="form-label">الحل</label>
                                        {solutions.map((v) => <div><input checked={this.state.solutions.includes(v.id)} onChange={this.onSelect("solutions")} className="form-check-input" name="solutions" type="checkbox" value={v.id} /> {v.solution}</div>)}
                                    </div>
                                </div>


                                <div className="col-6" >
                                    <div className="mb-3">
                                        <label for="" className="form-label">البرج</label>
                                        <input onChange={this.event("sector")} required={true} value={this.state.sector} type="text" name="sector" className="form-control rounded-pill" placeholder="ZXX-SECX..." maxlength="1024" id="id_sector" />
                                    </div>
                                </div>


                                <div className="col-6">
                                    <div className="mb-3">
                                        <label for="" className="form-label">المدينة</label>
                                        <select name="city" onChange={this.event("city")} className="form-control rounded-pill" placeholder="المدينة" id="id_city">
                                            {cities.map((v) => <option value={v.id} selected={v.id == this.state.city}>{v.name}</option>)}
                                        </select>
                                    </div>
                                </div>



                                <div className="col-12">
                                    <div className="mb-3">
                                        <label for="exampleInputEmail1" className="form-label">ملاحظات</label>
                                        <textarea onChange={this.event("note")} value={this.state.note} name="note" cols="40" rows="4" className="form-control rounded" placeholder="ملاحظات" maxlength="1024" id="id_note">
                                        </textarea>
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="mb-3">
                                        <label for="exampleInputEmail1" className="form-label">المكلف</label>
                                        <select onChange={this.event("fixer")} name="fixed_by" className="form-control rounded-pill" id="id_fixed_by">
                                            <option value="" selected> --------- </option>

                                            {this.props.employees.map((v, idx) => <option selected={this.state.fixer == v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="col"></div>
                                <div className="col-3 mt-5">
                                    <button type="submit" className="btn btn-primary w-100 rounded-pill">Save</button>
                                </div>
                                <div className="col"></div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="col"></div>
            </div>

        );
    }
}

class ProblemsReportView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            "tower":null
        }

    }


    render() {


        return (
            <div className={"over-layer show"} id="externalDataScreen">
                <div className={"over-layer show"} onClick={this.props.hide} />
                <div className='content bg-white' style={{ "width": "100%", "left": 0 }}>
                    <div className="row mb-2">
                        <div className="col" />
                        <div className="col-auto">
                            <button className="btn" onClick={this.props.hide}>X</button>
                        </div>
                    </div>

                    <div className="row mb-2">
                        <div className="col">
                        <form action="/ticket/report">
                        
                <div className="row mb-3">
                    <div className="col-8">
                        {/* <form id="filterForm"> */}
                        <div className="container-fluid">
                            <div className="row">
                            <div className="col-12">
                            <div className="w-100 border-hti border rounded-pill ">
                                
                                    <div className="container-fluid">
                                        <div className="row">
                                            <div className="col-auto border-end p-0">
                                                <button type="submit" className="btn btn-light bg-white border-0 rounded-pill"
                                                    id="inputGroup-sizing-lg">بحث
                                                </button>
                                            </div>
                                            <div className="col p-0">
                                                <input id="reportSearchField" name="q" type="text" className="form-control border-0 "
                                                    
                                                    aria-label="Sizing example input"
                                                    aria-describedby="inputGroup-sizing-lg" />
                                            </div>
                                        </div>
                                    </div>
                                
                            </div>
                        </div>
                                <div className="col-12">
                                    <div className="row">
                                        <div className="col-6">
                                            من
                                            <input name="from_date" type="date" className="form-control rounded-pill"
                                                
                                                
                                                aria-label="Sizing example input"
                                                aria-describedby="inputGroup-sizing-lg" />
                                        </div>
                                        <div className="col-6">
                                            الي
                                            <input name="to_date" type="date"
                                                className="form-control rounded-pill "
                                                
                                                
                                                aria-label="Sizing  input"
                                                aria-describedby="inputGroup-sizing-lg" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="col-6">
                                    المكان
                                    <input name="place"  type="text" className="form-control rounded-pill p-1"
                                        
                                        aria-label="Sizing example input"
                                        aria-describedby="inputGroup-sizing" />
                                </div>

                                <div className="col-6">
                                    المكلف
                                    <select name="state" className="form-control rounded-pill">
                                        <option value={""}>---</option>
                                        {this.props.employees.map((emp, idx) => <option value={emp.id} selected={false}>{emp.name}</option>)}
                                    </select>
                                    {/* {{ select_fixed }} */}
                                </div>
                                <div className="col-4">
                                    حالة التذاكر:

                                    <select name="state" className="form-control rounded-pill">
                                        {[...ticket_status.entries()].map((v, idx) => <option value={v[0]} >{v[1]}</option>)}
                                    </select>
                                </div>
                                        <div className="col-4">
                                            الحل:

                                            <select name="solution" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                {solutions.map((v, idx) => <option value={v.id} >{v.solution}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-4">
                                            البرج:

                                            <select name="tower" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                {towers.map((v, idx) => <option value={v.id} >{v.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-4">
                                            السكتور:

                                            <select  name="sector" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                {sectors.filter((v) => v.tower == this.state.tower).map((v, idx) => <option value={v.id} >{v.name}</option>)}
                                            </select>
                                        </div>
                                      
                                
                            </div>
                        </div>

                    </div>
                    <div className="col-4" style={{"max-height": "300px","overflow": "scroll"}}>
                    {problems.map((v,idx)=>
                            <div class="form-check">
                                <input type="checkbox" name="problem[]" value={v.id} class="form-check-input" id={`problemCheck${v.id}`}/>
                                <label class="form-check-label" for={`problemCheck${v.id}`}>{v.name}</label>
                            </div>)}
                    </div>
                </div>

                            <div className="col-12 text-center border-top">
                                <button type="submit" class="btn btn-primary">Export</button>
                            </div>
                            
                        </form>
                        </div>
                    </div>
                    
                </div>
            </div>
        );
    }
}


class MainView extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            employees: [],
            tickets: [],
            towers: [],
            sectors: [],
            cities: [],
            notifications: [],
            selected: null,
            add: false,
            saerch: "",
            place: "",
            from: "",
            to: "",
            fixer: "",
            state: 0,
            page: 1,
            city: "",
            search: "",
            from_date: "",
            to_date: "",
            tower: "",
            sector: "",
            problem: "",
            solution: "",
            sort: "",
            hasNext: false,
            hasPrev: false,
            reportExporter: false,
        }


        // this.ticket_status.set("4","");


    }

    componentDidMount() {
        this.loadTickets();
        this.loadEmployess();
        this.loadTowers();
        this.loadSectors();
        this.loadCities();
        this.loadSolutions();
        this.loadProblems();
        this.loadNotifications();

    }

    loadTickets = () => {
        this.setState({
            hasNext: false,
            hasPrev: false
        })
        $.ajax(`/api/ticket/list?q=${this.state.search}&from_date=${this.state.from_date}&to_date=${this.state.to_date}&place=${this.state.place}&state=${this.state.state}&city=${this.state.city}&page=${this.state.page}&tower=${this.state.tower}&sector=${this.state.sector}&problem=${this.state.problem}&solution=${this.state.solution}&fixed_by=${this.state.fixer}&sort_by=${this.state.sort}`, {
            success: (res) => {
                let items = [...this.state.tickets, ...res.results];
                this.setState({
                    tickets: items,
                    add: false,
                    edit: null,
                    total: res.count,
                    hasNext: res.next != null,
                    hasPrev: res.previous != null,
                });
            },
        });
    }

    searchAction = (e) => {
        e.preventDefault();
        this.state.page = 1;
        this.state.tickets = [];
        this.setState({
            page: 1,
            total: 0,
            tickets: []
        })

        this.loadTickets()
    }


    changePage = (i) => (e) => {
        e.preventDefault();
        this.state.page = i;
        this.setState({
            // page:i,
            total: 0
        })

        this.loadTickets()
    }

    loadEmployess = () => {
        $.ajax("/api/ticket/employees/list", {
            success: (res) => {
                employees = res.results;
                this.setState({
                    employees: employees
                });
            },
        });
    }

    loadTowers = () => {
        $.ajax("/api/tower/list", {
            success: (res) => {
                towers = res.results;
                this.setState({
                    towers: towers
                });
            },
        });
    }

    loadSectors = () => {
        $.ajax("/api/tower/sectors/list", {
            success: (res) => {
                sectors = res.results;
                this.setState({
                    sectors: sectors
                });
            },
        });
    }

    loadCities = () => {
        $.ajax("/api/ticket/cities/list", {
            success: (res) => {
                cities = res.results;
                this.setState({
                    cities: cities
                });
            },
        });
    }

    loadProblems = () => {
        $.ajax("/api/ticket/problems/list", {
            success: (res) => {
                problems = res.results;
                this.setState({
                    problems: problems
                });
            },
        });
    }
    loadNotifications = () => {
        $.ajax("/api/ticket/notifications/list", {
            success: (res) => {
                notifications = res.results;
                this.setState({
                    notifications: notifications
                });
            },
        });
    }

    loadSolutions = () => {
        $.ajax("/api/ticket/solutions/list", {
            success: (res) => {
                solutions = res.results;
                this.setState({
                    solutions: solutions
                });
            },
        });
    }

    event = (type) => e => {
        let v = e.target.value;
        let s = this.state;
        s[type] = v;
        if(type == "tower")
            s["sector"] = ""

        this.setState(s);
    }



    removeItem = (e) => {
        this.props.onDelete();
    };


    showAddItemDialog = (e) => {
        this.setState({
            add: true,
            edit: null,
        });
    };


    showEditItemDialog = (ticket) => {
        this.setState({
            add: true,
            edit: ticket,
        });
    };

    showHistoryDialog = (ticket) => {
        this.setState({

            history: ticket,
        });
    };

    showDeleteDialog = (ticket) => {
        this.setState({

            delete: ticket,
        });
    };
    showCloseDialog = (ticket) => {
        this.setState({
            close: ticket,
        });
    };

    showReportDialog = (e) => {
        e.preventDefault()
        this.setState({
            reportExporter: true,
        });
    };

    selectItem = (ticket) => {
        console.log(ticket);
        this.setState({
            selected: ticket,
        });
    };

    changeFixer = (ticket) => e => {
        e.preventDefault();
        let disabled=!(userinfo?.user_permissions.find((v)=>v.codename == "can_edit_ticket_fixer") != null)
        if(disabled)
            return
        console.log(ticket);
        let changeHost = "/ticket/change/" + ticket.id;
        $(e.target).attr('disabled', 'disabled');
        $.ajax({
            url: changeHost,
            type: "GET",
            data: { "new": e.target.value }, //$(this).serialize(),
            cache: false,

            success: (res) => {
                let data = $.parseJSON(res)
                if (data["changed"]) {
                }
                $(e.target).removeAttr('disabled');
                $(e.target).removeClass('border-danger');
                $(e.target).addClass('border-success');
                console.log(res)
            },
            error: (error,textStatus,errorThrown) => {
                console.log(error)
                console.log(textStatus)
                console.log(errorThrown)
                $(e.target).removeAttr('disabled');
                $(e.target).removeClass('border-success');
                $(e.target).addClass('border-danger');
                alert("Faild to assign ticket " + textStatus + errorThrown + " -- " + error);
            }
        })

    };



    addItem = (ticket) => {
        let id = this.state.tickets.findIndex((v, idx) => v.id == ticket.id)
        if (id == "-1")
            this.state.tickets = [ticket].concat(this.state.tickets)
        else
            this.state.tickets[id] = ticket
        // this.loadSockets()

        this.setState({
            tickets: this.state.tickets,
            add: false,
            close: null,
            selected: null,
        });
    };

    onDelete = (ticket) => {

        this.state.tickets = this.state.tickets.filter((v) => v.id != ticket.id)
        this.setState({
            tickets: this.state.tickets,
            add: false,
            close: null,
            selected: null,
        });
    };

    render() {
        // let card = this.state.towers;
        return (
            <div className="row">
                <div className="col-12 m-2">
                    <div className="row">
                        <div className="col"></div>
                        <div className="col-8 col-md-6">
                            <div className="w-100 border-hti border rounded-pill ">
                                <form onSubmit={this.searchAction}>
                                    <div className="container-fluid">
                                        <div className="row">
                                            <div className="col-auto border-end p-0">
                                                <button type="submit" className="btn btn-light bg-white border-0 rounded-pill"
                                                    id="inputGroup-sizing-lg">بحث
                                                </button>
                                            </div>
                                            <div className="col p-0">
                                                <input id="mainSearchField" onChange={this.event("search")} name="q" type="text" className="form-control border-0 "
                                                    value={this.state.search}
                                                    aria-label="Sizing example input"
                                                    aria-describedby="inputGroup-sizing-lg" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div className="col-3 col-md-auto p-0">
                            

                            <button onClick={this.showAddItemDialog} href="{% block add_url %}{% endblock %}" type="submit"
                                className="btn btn-primary border-0 rounded-pill"
                                id="inputGroup-sizing-lg">+ اضافة
                            </button>
                            
                        </div>
                        <div className="col"></div>
                    </div>
                </div>
                <div className="row mb-3">
                    <div className="col-12">
                        {/* <form id="filterForm"> */}
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-2 p-0">
                                    <p className="p-0 m-0">-</p>
                                    <a href={`/ticket/export?q=${this.state.search}&from_date=${this.state.from_date}&to_date=${this.state.to_date}&place=${this.state.place}&state=${this.state.state}&city=${this.state.city}&page=${this.state.page}&tower=${this.state.tower}&sector=${this.state.sector}&problem=${this.state.problem}&solution=${this.state.solution}&fixed_by=${this.state.fixer}&sort_by=${this.state.sort}`}
                                        className="btn btn-light bg-white border-0 rounded-pill">تصدير</a>
                                    <a href="/vip/static/winbox.zip" className={"btn btn-light bg-white border-0 rounded-pill"} >Get winbox</a>
                                    {/* <a href={`/ticket/report?q=${this.state.search}&from_date=${this.state.from_date}&to_date=${this.state.to_date}&place=${this.state.place}&state=${this.state.state}&city=${this.state.city}&page=${this.state.page}&tower=${this.state.tower}&sector=${this.state.sector}&problem=${this.state.problem}&solution=${this.state.solution}&fixed_by=${this.state.fixer}&sort_by=${this.state.sort}`}
                                        className="btn btn-light bg-white border-0 rounded-pill">تقرير</a> */}

                                    <a href="#" onClick={this.showReportDialog}
                                        className="btn btn-light bg-white border-0 rounded-pill">تقرير</a>

                                </div>
                                <div className="col-4">
                                    <div className="row">
                                        <div className="col-6">
                                            من
                                            <input name="from_date" type="date" className="form-control rounded-pill"
                                                value={this.state.from_date}
                                                onChange={this.event("from_date")}
                                                aria-label="Sizing example input"
                                                aria-describedby="inputGroup-sizing-lg" />
                                        </div>
                                        <div className="col-6">
                                            الي
                                            <input name="to_date" type="date"
                                                className="form-control rounded-pill "
                                                onChange={this.event("to_date")}
                                                value={this.state.to_date}
                                                aria-label="Sizing  input"
                                                aria-describedby="inputGroup-sizing-lg" />
                                        </div>
                                    </div>
                                </div>
                                {/* <div className="col"></div> */}
                                <div className="col-2">
                                    المكان
                                    <input name="place" onChange={this.event("place")} type="text" className="form-control rounded-pill p-1"
                                        value={this.state.place}
                                        aria-label="Sizing example input"
                                        aria-describedby="inputGroup-sizing" />
                                </div>

                                <div className="col-2">
                                    المكلف
                                    <select onChange={this.event("fixer")} name="state" className="form-control rounded-pill">
                                        <option value={""}>---</option>
                                        {this.state.employees.map((emp, idx) => <option value={emp.id} selected={false}>{emp.name}</option>)}
                                    </select>
                                    {/* {{ select_fixed }} */}
                                </div>
                                <div className="col-2">
                                    حالة التذاكر:

                                    <select onChange={this.event("state")} name="state" className="form-control rounded-pill">
                                        {[...ticket_status.entries()].map((v, idx) => <option value={v[0]} >{v[1]}</option>)}
                                    </select>
                                </div>
                                <div className="col-12">
                                    <div className="row">
                                        <div className="col"></div>
                                        <div className="col-2">
                                            البرج:

                                            <select onChange={this.event("tower")} name="state" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                {towers.map((v, idx) => <option value={v.id} >{v.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-2">
                                            السكتور:

                                            <select onChange={this.event("sector")} name="state" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                {sectors.filter((v) => v.tower == this.state.tower).map((v, idx) => <option value={v.id} >{v.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-2">
                                            المشكلة:

                                            <select onChange={this.event("problem")} name="state" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                {problems.map((v, idx) => <option value={v.id} >{v.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-2">
                                            الحل:

                                            <select onChange={this.event("solution")} name="state" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                {solutions.map((v, idx) => <option value={v.id} >{v.solution}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-2">
                                            ترتيب حسب:

                                            <select onChange={this.event("sort")} name="state" className="form-control rounded-pill">
                                                <option value={""} >-</option>
                                                
                                                {[...sort_by.entries()].map((v, idx) => <option value={v[0]} >{v[1]}</option>)}
                                            </select>
                                        </div>
                                        
                                    </div>
                                </div>
                                <input name="q" onChange={this.event("q")} id='secondrySearch' type="hidden" className="form-control rounded-pill p-1"
                                    value={this.state.q}
                                    aria-label="Sizing example input"
                                    aria-describedby="inputGroup-sizing" />
                            </div>
                        </div>

                    </div>
                </div>
                <div className="w-100 bg-hti rounded-pill">
                    <div className="row">
                        <div className="row">
                            <div className="col-2">تاريخ</div>
                            <div className="col">الاسم</div>
                            <div className="col-1">الهاتف</div>
                            <div className="col-1 d-none d-md-block">المكان</div>
                            <div className="col-1 d-none d-md-block">البرج</div>
                            <div className="col-2 d-none d-md-block">المكلف بها</div>

                            <div className="col-2 d-none d-md-block">ملاحظة / الحل</div>

                            {/* {% if "Ticket.can_close_ticket" in perms or "Ticket.can_edit_ticket" in perms or "Ticket.can_cancel_ticket" in perms %} */}
                            <div className="col-1">
                                <div className="col px-4 mx-2 d-none d-md-block">-</div>

                            </div>
                            {/* {% endif %} */}
                        </div>
                    </div>
                </div>
                <div className="col-12 my-2">
                    {this.state.tickets.map((ticket, idx) =>
                        <div className="row px-2" id="ticket-">
                            <div className={`bg-light ${ticket.close_state == "1" ? "text-success" : ""} ${ticket.close_state == "2" ? "text-danger" : ""} ${ticket.close_state == "3" ? "text-info" : ""} shadow-none mt-1 rounded py-2`}>
                                <div className="row">
                                    <div id="ticket-id-" className="col-2">
                                        <div> {ticket.created_at} </div>
                                        <div> {ticket.opened_by ? ticket.opened_by.name : ""}</div>
                                    </div>
                                    <div className="col">
                                    
                                        <div id="ticket-account-"> {ticket.account} {ticket.notifications.length > 0 ? <span className="badge bg-primary">تنبيهات {ticket.notifications.length}</span>:""} </div>
                                        <div id="ticket-name-">{ticket.name}</div>
                                    </div>
                                    <div id="ticket-phone-" className="col-1"> {ticket.phone}</div>
                                    <div id="ticket-place-container-" className="col-1 d-none d-md-block">
                                        <div id="ticket-account-"> {cities.findIndex((v) => v.id == ticket.city) != -1 ? cities.find((v) => v.id == ticket.city).name : ""} </div>
                                        <div id="ticket-place-">{ticket.place} </div>

                                    </div>
                                    <div id="ticket-problem-" className="col-1 d-none d-md-block p-0">
                                        {ticket.sector}
                                    </div>

                                    <div className="col-2 p-0 d-none d-md-block">
                                        <div>
                                            <select disabled={!(userinfo?.user_permissions.find((v)=>v.codename == "can_edit_ticket_fixer") != null)}  onChange={this.changeFixer(ticket)} name="state" className="form-control rounded-pill">
                                                <option value={null}>---</option>
                                                {this.state.employees.map((emp, idx) => <option value={emp.id} selected={ticket.fixed_by == emp.id}>{emp.name}</option>)}
                                            </select>
                                        </div>

                                    </div>
                                    <div className="col-2 p-0 d-none d-md-block">
                                        {problems.filter((v) => ticket.problem.includes(v.id)).map((v) => v.name).join(" / ")}
                                        <div className="text-muted">
                                            {solutions.filter((v) => ticket.solutions.includes(v.id)).map((v) => v.solution).join(" / ")}
                                        </div>
                                        {ticket.close_state == "1" ? ticket.solution : ticket.note}
                                        <div>
                                        {ticket.last_comment?ticket.last_comment.comment:""}
                                        </div>

                                    </div>

                                    <div className="col-1 d-none d-md-block p-0 m-0">
                                    {userinfo?.user_permissions.find((v)=>v.codename == "can_close_ticket") != null?
                                        <button onClick={(e) => this.showCloseDialog(ticket)}
                                            className="btn btn-link rounded-pill p-0">اغلاق
                                        </button>:""}
                                        {/* {% endif %} */}

                                        {/* {% if "Ticket.can_cancel_ticket" in perms %} */}

                                        {userinfo?.user_permissions.find((v)=>v.codename == "can_cancel_ticket") != null? 
                                        <button onClick={(e) => this.showDeleteDialog(ticket)}
                                            className="btn btn-link rounded-pill p-0">حذف
                                        </button>:""}
                                        
                                        
                                        {userinfo?.user_permissions.find((v)=>v.codename == "can_edit_ticket") != null?
                                            <button onClick={(e) => this.showEditItemDialog(ticket)} 
                                            className="btn btn-link rounded-pill p-0">تعديل</button>:""
                                        }
                                        <button onClick={(e) => this.showHistoryDialog(ticket)}
                                            className="btn btn-link rounded-pill p-0">التاريخ</button>
                                        {/* {% endif %} */}
                                        <div className="w-100">
                                            {ticket.opened_1_month > 0 ? <span className="badge bg-danger">{ticket.opened_1_month}</span> : ""}
                                            {ticket.opened_3_month > 0 ? <span className="badge bg-warning">{ticket.opened_3_month}</span> : ""}
                                            {ticket.total_tickets > 0 ? <span className="badge bg-secondary">{ticket.total_tickets}</span> : ""}
                                        </div>
                                    </div>
                                    <div className="col-12 d-none d-md-block p-0 m-0">
                                        {ticket.ticket_open_info ? <table className="table table-sm m-0"><tbody>
                                            <tr>
                                            
                                                <td className=" border-0">IP: <a href={`winbox:=${ticket.ticket_open_info.ip}=admin=atmcis@hti`} className={"btn btn-link border-0 p-0 m-0"} >{ticket.ticket_open_info.ip}</a></td>
                                                <td className=" border-0">MAC: {ticket.ticket_open_info.mac} </td>
                                                <td className=" border-0">Rx/Tx: {ticket.ticket_open_info.rx} / {ticket.ticket_open_info.tx} </td>
                                                <td className=" border-0">Qrx/Qtx: {ticket.ticket_open_info.rxq}/{ticket.ticket_open_info.txq} </td>
                                                <td className=" border-0">PoE(pw): {ticket.ticket_open_info.password}</td>
                                                <td className=" border-0">Tower: {towers.find((v)=>v.id == ticket.ticket_open_info.tower)?towers.find((v)=>v.id == ticket.ticket_open_info.tower).name:""}</td>
                                                <td className=" border-0">Sector: {ticket.ticket_open_info.sector_name}</td>
                                            </tr>
                                        </tbody>
                                        </table> : ""}
                                    </div>
                                    {/* {% endif %} */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* <div className="row mt-5">
                    الصفحة الحالية: {this.state.tickets.length} , العدد الكلي: {this.state.tickets.lenght}
                </div> */}
                {this.state.close != null ? <CloseTicket hide={() => this.setState({ close: null })} ticket={this.state.close} success={this.addItem} employees={this.state.employees} /> : ""}
                {this.state.selected != null ? <DetailView hide={() => this.setState({ selected: null })} ticket={this.state.selected} /> : ""}
                {this.state.add ? <AddDialogView employees={this.state.employees} sectors={this.state.sectors} cities={this.state.cities} ticket={this.state.edit} hide={() => this.setState({ add: false })} success={this.addItem} /> : ""}
                {this.state.history != null ? <HistoryOfTicket employees={this.state.employees} sectors={this.state.sectors} cities={this.state.cities} ticket={this.state.history} hide={() => this.setState({ history: null })} /> : ""}
                {this.state.delete != null ? <DeleteTicket ticket={this.state.delete} success={this.onDelete} hide={() => this.setState({ delete: null })} /> : ""}
                {this.state.reportExporter ? <ProblemsReportView ticket_status={this.state.ticket_status} employees={this.state.employees} sectors={this.state.sectors} cities={this.state.cities} ticket={this.state.delete} success={this.onDelete} hide={() => this.setState({ reportExporter: false })} /> : ""}

                <nav aria-label="Page navigation example">
                    <ul className="pagination justify-content-center">
                        <li className="page-item"><a className="page-link" >{this.state.tickets.length} / {this.state.total}</a></li>

                        <li className={`page-item ${!this.state.hasNext ? "disabled" : ""}`}>
                            <a className="page-link" onClick={this.changePage(this.state.page + 1)} href="#" aria-label="Next">
                                المزيد <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        );
    }
}

let item = document.getElementById("container");
const e = React.createElement;
ReactDOM.render(e(MainView), item);