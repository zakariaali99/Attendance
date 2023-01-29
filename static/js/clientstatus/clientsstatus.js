let ticket_status = new Map();
ticket_status.set("0", "المفتوحة");
ticket_status.set("1", "المنجزة");
ticket_status.set("2", "غير المنجزة");
ticket_status.set("3", "المتابعة");
ticket_status.set("4", "الكل");

let sort_by = new Map();

sort_by.set("date", "آخر اتصال");
sort_by.set("-date", "آخر اتصال (تنازلي)");
sort_by.set("expiration", "انتهاء الصلاحية");
sort_by.set("-expiration", "انتهاء الصلاحية(تنازلي)");
sort_by.set("name", "الاسم");
sort_by.set("-name", "الاسم (تنازلي)");
sort_by.set("account", "الحساب");
sort_by.set("-account", "الحساب (تنازلي)");
// sort_by.set("problem", "المشكلة");

let problems = [];
let solutions = [];
let employees = [];
let towers = [];
let cities = [];
let sectors = [];

let profiles = [];
var all_tickets = [];
var all_users = [];
var sas_users = [];
var filterdProfiles = new Map();
var allProfiles = new Map();
// var profilesDetails = new Map();

var coffeeBandWidth = 0;
var gigaDinar = 0;
var coffe = 0;
var adslAdded = 0;
var wifiAdded = 0;

function randomColor() {
  return "#" + (((1 << 24) * Math.random()) | 0).toString(16);
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
        comments: [],
      };
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
        close_state: "0",
        comments: [],
        solutions: [],
      };
    console.log(this.state);
  }

  submit = (e) => {
    e.preventDefault();
    console.log(this.props.ticket);
    let view = this;
    var url = `/api/clients/${view.props.ticket.id}/close`;
    var method = "POST";

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
        comments: [],
      }),
      success: (res) => {
        console.log(res);
        view.props.success(res);
        view.props.hide();
      },
    });
  };

  delete = (e) => {
    e.preventDefault();
    let view = this;
    let token = $("input[name=csrfmiddlewaretoken]").val();
    jQuery.ajax({
      url: "/clients/delete/" + view.props.ticket.id,
      type: "GET",
      cache: false,
      success: (res) => {
        view.props.success(view.props.ticket);
        view.props.hide();
      },
      fail: (error) => {
        console.log(error);
      },
    });
  };

  event = (type) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[type] = v;
    this.setState(s);
  };

  render() {
    return (
      <div className="over-layer show" id="dialog" style={{ display: "block" }}>
        <div
          onClick={(e) => this.props.hide()}
          className="over-layer show"
          id="dialog"
          style={{ display: "block" }}
        ></div>
        <div className="content">
          <div className="header">
            <div
              onClick={(e) => this.props.hide()}
              id="closeDeleteDialog"
              class="btn btn-close"
            ></div>
          </div>
          <div className="body text-center">
            <p className="text-danger">هل تريد بالتاكيد حذف هذه التذكرة؟</p>
            <p id="deleteTitle" className="text-danger">
              {this.props.ticket.account} - {this.props.ticket.name}
            </p>
            <button
              onClick={this.delete}
              id="deleteTicket"
              type="button"
              className="btn btn-danger"
            >
              حذف
            </button>
          </div>
        </div>
      </div>
    );
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
        sector: props.ticket.sector,
        city: props.ticket.city,
        note: props.ticket.note,
        fixed_by: props.ticket.fixed_by,
        close_state: props.ticket.close_state,
        solutions: props.ticket.solutions,
        comments: [],
      };
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
        close_state: "0",
        comments: [],
        solutions: [],
      };
    console.log(this.state);
  }

  submit = (e) => {
    e.preventDefault();
    console.log(this.props.ticket);
    let view = this;
    var url = `/api/clients/${view.props.ticket.id}/close`;
    var method = "POST";

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
        comments: [],
      }),
      success: (res) => {
        console.log(res);
        view.props.success(res);
        view.props.hide();
      },
    });
  };

  componentDidMount() {
    this.loadComments();
  }

  submitUpdate = (e) => {
    console.log("Head first");
    e.preventDefault();
    console.log("prevented");
    let view = this;
    var url = `/api/clients/update`;
    var method = "POST";

    if (this.state.comment.length <= 2) return;

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
        });
        // view.props.success(res)
      },
    });
  };

  event = (type) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[type] = v;
    this.setState(s);
  };

  onSelect = (type) => (e) => {
    let v = Number(e.target.value);
    let s = this.state;
    let idx = s[type].findIndex((it, idx) => v == it);
    if (idx == -1) s[type].push(v);
    else s[type] = s[type].filter((it) => it != v);
    // s[type] = v;
    this.setState(s);
  };

  loadComments = () => {
    $.ajax(`/api/clients/comments/${this.state.ticket.id}/list`, {
      success: (res) => {
        let items = res.results;
        this.setState({
          comments: items,
        });
      },
    });
  };

  render() {
    return (
      <div className="over-layer show" id="dialog" style={{ display: "block" }}>
        <div
          onClick={(e) => this.props.hide()}
          className="over-layer show"
          id="dialog"
          style={{ display: "block" }}
        ></div>
        <div className="content">
          <div className="header">
            <button
              id="closeDialog"
              onClick={(e) => this.props.hide()}
              className="btn btn-close"
            ></button>
          </div>
          <div className="body">
            <div className="row text-center">
              <strong id="closeTitle" className="text-success w-100">
                {this.props.ticket.id} - {this.props.ticket.name} -{" "}
                {this.props.ticket.account} - {this.props.ticket.phone}
              </strong>
            </div>
            <div className="container">
              <div className="row">
                <div className="col"></div>
                <div className="col-12">
                  <form
                    method="post"
                    id="close_ticket_form"
                    onSubmit={this.submit}
                  >
                    {/* <input  type="hidden" name="csrfmiddlewaretoken" value="jlxXEtD914tRbBHFNRpmwZ2GMW9QV7T7Gy29Qr7iE1CC81oM9lm9JjJFBXheyNjs"/> */}
                    <div className="container">
                      <div className="row">
                        <div className="col-6">
                          <div className="mb-3">
                            <label for="id_fixed_by" className="form-label">
                              المكلف بها
                            </label>
                            <select
                              disabled={
                                !(
                                  userinfo.user_permissions.find(
                                    (v) => v.codename == "can_edit_ticket_fixer"
                                  ) != null
                                )
                              }
                              onChange={this.event("fixed_by")}
                              name="fixed_by"
                              className="form-control rounded-pill"
                              required=""
                              id="id_fixed_by"
                            >
                              <option value="">---------</option>
                              {this.props.employees.map((emp, idx) => (
                                <option
                                  value={emp.id}
                                  selected={emp.id == this.state.fixed_by}
                                >
                                  {emp.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label
                              for="exampleInputEmail1"
                              className="form-label"
                            >
                              البرج
                            </label>
                            <input
                              type="text"
                              value={this.state.sector}
                              onChange={this.event("sector")}
                              name="tower"
                              className="form-control rounded-pill"
                              id="id_tower"
                            />
                          </div>
                        </div>

                        <div className="col-6">
                          <div
                            className="mb-3  bg-light"
                            style={{
                              "max-height": "200px",
                              overflow: "scroll",
                            }}
                          >
                            <label
                              for="exampleInputEmail1"
                              className="form-label"
                            >
                              المشكلة
                            </label>
                            {problems.map((v) => (
                              <div>
                                <input
                                  checked={this.state.problem.includes(v.id)}
                                  onChange={this.onSelect("problem")}
                                  className="form-check-input"
                                  name="problem"
                                  type="checkbox"
                                  value={v.id}
                                />{" "}
                                {v.name}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="col-6">
                          <div
                            className="mb-3 bg-light"
                            style={{
                              "max-height": "200px",
                              overflow: "scroll",
                            }}
                          >
                            <label
                              for="exampleInputEmail1"
                              className="form-label"
                            >
                              الحل
                            </label>
                            {solutions.map((v) => (
                              <div>
                                <input
                                  checked={this.state.solutions.includes(v.id)}
                                  onChange={this.onSelect("solutions")}
                                  className="form-check-input"
                                  name="solutions"
                                  type="checkbox"
                                  value={v.id}
                                />{" "}
                                {v.solution}
                              </div>
                            ))}
                          </div>
                        </div>

                        {this.state.note ? <div className="col-12">
                                                <div className="mb-3">
                                                    <label for="exampleInputEmail1" className="form-label">ملاحظات</label>
                                                    <p>{this.state.note}</p>
                                                </div>
                                            </div>:""}
                        <div className="col-6 mx-auto">
                          <div className="mb-3">
                            <label
                              for="exampleInputEmail1"
                              className="form-label"
                            >
                              حالة الاغلاق
                            </label>
                            <select
                              onChange={this.event("close_state")}
                              name="state"
                              className="form-control rounded-pill"
                              id="id_state"
                            >
                              {[...ticket_status.entries()].map((v, idx) => (
                                <option
                                  selected={this.state.close_state == v[0]}
                                  value={v[0]}
                                >
                                  {v[1]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="col-12 text-center my-3">
                          <button
                            id="#close_ticket"
                            type="submit"
                            className="btn btn-primary px-5 rounded-pill"
                          >
                            حفظ
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
                <div className="col"></div>
                {this.state.comments.length > 0 ? <hr /> : ""}
                {this.state.comments.map((v, idx) => (
                  <div className="col-12">
                    <div className="row ">
                      <div className={`bg-light  shadow-none mt-1 rounded p-2`}>
                        <div className="row">
                          <div className="col-12">{v.comment}</div>
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
                  </div>
                ))}
                <hr />
                <div className="col-12">
                  <form method="POST" onSubmit={this.submitUpdate}>
                    <textarea
                      onChange={this.event("comment")}
                      value={this.state.comment}
                      name="solution"
                      className="form-control rounded"
                      rows="5"
                      id="id_solution"
                    ></textarea>
                    <div className="col-2 my-3">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 rounded-pill"
                      >
                        اضافة
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
    };
  }

  componentDidMount() {
    this.load(1);
  }

  load = (range) => {
    let socket = this.state.socket;
    var url = `/api/socket/${socket.id}/detail?range=${range}`;
    if (range == -1) {
      url = `/api/socket/${socket.id}/detail?from=${this.state.from}&to=${this.state.to}`;
    }
    $.ajax(url, {
      success: (res) => {
        let items = res.status;
        console.log(items, res);
        this.setState({
          details: items,
          loading: false,
        });
      },
    });
  };

  removeItem = (e) => {
    this.props.onDelete();
  };

  selectType = (e) => {
    let v = e.target.value;
    this.setState({
      type: v,
    });
  };
  selectFromDate = (e) => {
    let v = e.target.value;
    this.setState({
      from: v,
    });
    if (this.state.type == -1) this.load(-1);
  };
  selectToDate = (e) => {
    let v = e.target.value;

    this.setState({
      to: v,
    });
    if (this.state.type == -1) this.load(-1);
  };
  selectViewRange = (range) => {
    this.setState({
      rangeView: range,
      loading: true,
    });
    setTimeout(() => {
      this.load(range);
    }, 500);
  };

  render() {
    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={this.props.hide} />
        <div className="content bg-white" style={{ width: "100%", left: 0 }}>
          <div className="row mb-2">
            <div className="col" />
            <div className="col-auto">
              <button className="btn" onClick={this.props.hide}>
                X
              </button>
            </div>
          </div>
          <div className="row mb-2">
            <div className="col">
              <p>Type</p>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  checked={this.state.type == "temp"}
                  type="radio"
                  onClick={this.selectType}
                  name="inlineRadioOptions"
                  id="inlineRadio1"
                  value="temperature"
                />
                <label className="form-check-label" for="inlineRadio1">
                  Temperature
                </label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={this.selectType}
                  name="inlineRadioOptions"
                  id="inlineRadio2"
                  value="voltage"
                />
                <label className="form-check-label" for="inlineRadio2">
                  voltage
                </label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={this.selectType}
                  name="inlineRadioOptions"
                  id="inlineRadio3"
                  value="current"
                />
                <label className="form-check-label" for="inlineRadio3">
                  current
                </label>
              </div>

              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={this.selectType}
                  name="inlineRadioOptions"
                  id="inlineRadio3"
                  value="txPower"
                />
                <label className="form-check-label" for="inlineRadio3">
                  txPower
                </label>
              </div>

              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  onClick={this.selectType}
                  name="inlineRadioOptions"
                  id="inlineRadio3"
                  value="rxPower"
                />
                <label className="form-check-label" for="inlineRadio3">
                  rxPower
                </label>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <p className="p-0 m-0">Select peroid:</p>
            </div>
            <div className="col-4">
              <form>
                <div className="row">
                  <div className="form-group col-6">
                    <label>From</label>
                    <input
                      type="date"
                      value={this.state.from}
                      onChange={this.selectFromDate}
                      className="form-control"
                      id="fromDate"
                      placeholder="From"
                    />
                  </div>
                  <div className="form-group col-6">
                    <label>To</label>
                    <input
                      type="date"
                      value={this.state.to}
                      onChange={this.selectToDate}
                      className="form-control"
                      id="toDate"
                      placeholder="To"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="row ">
            {!this.state.loading ? (
              <GraphView item={graphData} />
            ) : (
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: "100%" }}
                  aria-valuenow="100"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            )}
          </div>

          <div className="row mb-2"></div>
        </div>
      </div>
    );
  }
}

class AddDialogView extends React.Component {
  constructor(props) {
    super(props);
    if (props.user != null && typeof props.user != typeof undefined)
      this.state = {
        ticket: props.ticket,
        name: props.user.firstname + " " + props.user.lastname,
        account: props.user.username,
        phone: props.user.phone,
        place: props.user.place,
        problem: [],
        solutions: [],
        solution: "",
        sector: props.user.sector,
        city: props.user.city,
        note: props.user.note,
        fixer: props.user.fixed_by,
      };
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
      };
    console.log(this.state);
  }

  submit = (e) => {
    e.preventDefault();

    let view = this;
    var url = `/api/clients/add`;
    var method = "POST";
    if (view.props.ticket != null) {
      url = `/api/clients/${view.props.ticket.id}/edit`;
      method = "PUT";
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
        view.props.success(res);
      },
    });
  };
  event = (type) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[type] = v;
    this.setState(s);
  };

  onSelect = (type) => (e) => {
    let v = Number(e.target.value);
    let s = this.state;
    let idx = s[type].findIndex((it, idx) => v == it);
    if (idx == -1) s[type].push(v);
    else s[type] = s[type].filter((it) => it != v);

    this.setState(s);
  };

  render() {
    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={this.props.hide} />
        <div className="content bg-white">
          <form onSubmit={this.submit}>
            <div className="container">
              <div className="row">
                <div className="col-8">
                  <div className="mb-3">
                    <label for="exampleInputEmail1" className="form-label">
                      الاسم
                    </label>
                    <input
                      value={this.state.name}
                      required={true}
                      onChange={this.event("name")}
                      type="text"
                      name="name"
                      className="form-control rounded-pill"
                      placeholder="الاسم"
                      maxlength="2048"
                      
                      id="id_name"
                    />
                  </div>
                </div>
                <div className="col-4">
                  <div className="mb-3">
                    <label for="exampleInputEmail1" className="form-label">
                      الحساب
                    </label>
                    <input
                      value={this.state.account}
                      required={true}
                      onChange={this.event("account")}
                      type="text"
                      name="account"
                      className="form-control rounded-pill"
                      placeholder="الحساب"
                      maxlength="1024"
                      id="id_account"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="mb-3">
                    <label for="exampleInputEmail1" className="form-label">
                      الهاتف
                    </label>
                    <input
                      value={this.state.phone}
                      required={false}
                      onChange={this.event("phone")}
                      type="text"
                      name="phone"
                      rows="3"
                      className="form-control rounded-pill"
                      placeholder="رقم الهاتف"
                      maxlength="1024"
                      id="id_phone"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className="mb-3">
                    <label for="exampleInputEmail1" className="form-label">
                      المكان
                    </label>
                    <input
                      value={this.state.place}
                      required={false}
                      onChange={this.event("place")}
                      type="text"
                      name="place"
                      className="form-control rounded-pill"
                      placeholder="المكان..."
                      maxlength="1024"
                      id="id_place"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className="mb-3  bg-light"
                    style={{ "max-height": "200px", overflow: "scroll" }}
                  >
                    <label for="exampleInputEmail1" className="form-label">
                      المشكلة
                    </label>
                    {problems.map((v) => (
                      <div>
                        <input
                          checked={this.state.problem.includes(v.id)}
                          onChange={this.onSelect("problem")}
                          className="form-check-input"
                          name="problem"
                          type="checkbox"
                          value={v.id}
                        />{" "}
                        {v.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-6">
                  <div
                    className="mb-3 bg-light"
                    style={{ "max-height": "200px", overflow: "scroll" }}
                  >
                    <label for="exampleInputEmail1" className="form-label">
                      الحل
                    </label>
                    {solutions.map((v) => (
                      <div>
                        <input
                          checked={this.state.solutions.includes(v.id)}
                          onChange={this.onSelect("solutions")}
                          className="form-check-input"
                          name="solutions"
                          type="checkbox"
                          value={v.id}
                        />{" "}
                        {v.solution}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-6">
                  <div className="mb-3">
                    <label for="" className="form-label">
                      البرج
                    </label>
                    <input
                      onChange={this.event("sector")}
                      required={false}
                      value={this.state.sector}
                      type="text"
                      name="sector"
                      className="form-control rounded-pill"
                      placeholder="ZXX-SECX..."
                      maxlength="1024"
                      id="id_sector"
                    />
                  </div>
                </div>

                <div className="col-6">
                  <div className="mb-3">
                    <label for="" className="form-label">
                      المدينة
                    </label>
                    <select
                      name="city"
                      onChange={this.event("city")}
                      className="form-control rounded-pill"
                      placeholder="المدينة"
                      id="id_city"
                    >
                      {cities.map((v) => (
                        <option value={v.id} selected={v.id == this.state.city}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 
                                <div className="col-12">
                                    <div className="mb-3">
                                        <label for="exampleInputEmail1" className="form-label">ملاحظات</label>
                                        <textarea onChange={this.event("note")} value={this.state.note} name="note" cols="40" rows="4" className="form-control rounded" placeholder="ملاحظات" maxlength="1024" id="id_note">
                                        </textarea>
                                    </div>
                                </div> */}

                <div className="col-12 text-center mt-5">
                  <button
                    type="submit"
                    className="btn btn-primary px-5 rounded-pill"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="col"></div>
      </div>
    );
  }
}

class WaitDialogView extends React.Component {
  render() {
    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={this.props.hide} />
        <div className="content bg-white text-center">
          <div class="spinner-border" role="status"></div>
          <br />
          <span class="sr-only">Loading...</span>
        </div>
        <div className="col"></div>
      </div>
    );
  }
}

class RecordedClients extends React.Component {
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
      };
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
      };
    console.log(this.state);
  }

  submit = (e) => {
    e.preventDefault();
    console.log("prevented");
    let view = this;
    var url = `/api/clients/add`;
    var method = "POST";
    if (view.props.ticket != null) {
      url = `/api/clients/${view.props.ticket.id}/edit`;
      method = "PUT";
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
        view.props.success(res);
      },
    });
  };
  event = (type) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[type] = v;
    this.setState(s);
  };

  onSelect = (type) => (e) => {
    let v = Number(e.target.value);
    let s = this.state;
    let idx = s[type].findIndex((it, idx) => v == it);
    if (idx == -1) s[type].push(v);
    else s[type] = s[type].filter((it) => it != v);
    // s[type] = v;
    this.setState(s);
  };

  render() {
    return (
      <div>
        <div className="w-100 bg-hti rounded-pill">
          <div className="row">
            <div className="row">
              <div className="col-2">تاريخ</div>
              <div className="col">الاسم</div>
              <div className="col-1">الهاتف</div>
              <div className="col-1 d-none d-md-block">المكان</div>
              <div className="col-1 d-none d-md-block">البرج</div>

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
          {this.props.tickets.map((ticket, idx) => (
            <div className="row px-2" id="ticket-">
              <div
                className={`bg-light ${
                  ticket.close_state == "1" ? "text-success" : ""
                } ${ticket.close_state == "2" ? "text-danger" : ""} ${
                  ticket.close_state == "3" ? "text-info" : ""
                } shadow-none mt-1 rounded py-2`}
              >
                <div className="row">
                  <div id="ticket-id-" className="col-2">
                    <div> {ticket.created_at} </div>
                    <div> {ticket.opened_by ? ticket.opened_by.name : ""}</div>
                  </div>
                  <div className="col">
                    <div id="ticket-account-"> {ticket.account} </div>
                    <div id="ticket-name-">{ticket.name}</div>
                  </div>
                  <div id="ticket-phone-" className="col-1">
                    {" "}
                    {ticket.phone}
                  </div>
                  <div
                    id="ticket-place-container-"
                    className="col-1 d-none d-md-block"
                  >
                    <div id="ticket-account-">
                      {" "}
                      {cities.findIndex((v) => v.id == ticket.city) != -1
                        ? cities.find((v) => v.id == ticket.city).name
                        : ""}{" "}
                    </div>
                    <div id="ticket-place-">{ticket.place} </div>
                  </div>
                  <div
                    id="ticket-problem-"
                    className="col-1 d-none d-md-block p-0"
                  >
                    {ticket.sector}
                  </div>
                  <div className="col-2 p-0 d-none d-md-block">
                    {problems
                      .filter((v) => ticket.problem.includes(v.id))
                      .map((v) => v.name)
                      .join(" / ")}
                    <div className="text-muted">
                      {solutions
                        .filter((v) => ticket.solutions.includes(v.id))
                        .map((v) => v.solution)
                        .join(" / ")}
                    </div>
                    {ticket.close_state == "1" ? ticket.solution : ticket.note}
                    <div>
                      {ticket.last_comment ? ticket.last_comment.comment : ""}
                    </div>
                  </div>

                  <div className="col-1 d-none d-md-block p-0 m-0">
                    <button
                      onClick={(e) => this.props.showCloseDialog(ticket)}
                      className="btn btn-link rounded-pill p-0"
                    >
                      اغلاق
                    </button>

                    <button
                      onClick={(e) => this.props.showDeleteDialog(ticket)}
                      className="btn btn-link rounded-pill p-0"
                    >
                      حذف
                    </button>
                  </div>
                  <div className="col-12 d-none d-md-block p-0 m-0">
                    {ticket.ticket_open_info ? (
                      <table className="table table-sm m-0">
                        <tbody>
                          <tr>
                            <td className=" border-0">
                              IP:{" "}
                              <a
                                href={`winbox:=${ticket.ticket_open_info.ip}=admin=atmcis@hti`}
                                className={"btn btn-link border-0 p-0 m-0"}
                              >
                                {ticket.ticket_open_info.ip}
                              </a>
                            </td>
                            <td className=" border-0">
                              MAC: {ticket.ticket_open_info.mac}{" "}
                            </td>
                            <td className=" border-0">
                              Rx/Tx: {ticket.ticket_open_info.rx} /{" "}
                              {ticket.ticket_open_info.tx}{" "}
                            </td>
                            <td className=" border-0">
                              Qrx/Qtx: {ticket.ticket_open_info.rxq}/
                              {ticket.ticket_open_info.txq}{" "}
                            </td>
                            <td className=" border-0">
                              PoE(pw): {ticket.ticket_open_info.password}
                            </td>
                            <td className=" border-0">
                              Tower:{" "}
                              {towers.find(
                                (v) => v.id == ticket.ticket_open_info.tower
                              )
                                ? towers.find(
                                    (v) => v.id == ticket.ticket_open_info.tower
                                  ).name
                                : ""}
                            </td>
                            <td className=" border-0">
                              Sector: {ticket.ticket_open_info.sector_name}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      ""
                    )}
                  </div>
                  {/* {% endif %} */}
                </div>
              </div>
            </div>
          ))}
          <nav aria-label="Page navigation example">
            <ul className="pagination justify-content-center">
              <li className="page-item">
                <a className="page-link">
                  {this.props.tickets.length} / {this.state.total}
                </a>
              </li>

              <li
                className={`page-item ${!this.state.hasNext ? "disabled" : ""}`}
              >
                <a
                  className="page-link"
                  onClick={this.props.changePage(this.state.page + 1)}
                  href="#"
                  aria-label="Next"
                >
                  المزيد <span aria-hidden="true">&raquo;</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    );
  }
}

class ProblemsReportView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tower: null,
    };
  }

  render() {
    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={this.props.hide} />
        <div className="content bg-white" style={{ width: "100%", left: 0 }}>
          <div className="row mb-2">
            <div className="col" />
            <div className="col-auto">
              <button className="btn" onClick={this.props.hide}>
                X
              </button>
            </div>
          </div>

          <div className="row mb-2">
            <div className="col">
              <form action="/clients/report">
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
                                  <button
                                    type="submit"
                                    className="btn btn-light bg-white border-0 rounded-pill"
                                    id="inputGroup-sizing-lg"
                                  >
                                    بحث
                                  </button>
                                </div>
                                <div className="col p-0">
                                  <input
                                    id="reportSearchField"
                                    name="q"
                                    type="text"
                                    className="form-control border-0 "
                                    aria-label="Sizing example input"
                                    aria-describedby="inputGroup-sizing-lg"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="row">
                            <div className="col-6">
                              من
                              <input
                                name="from_date"
                                type="date"
                                className="form-control rounded-pill"
                                aria-label="Sizing example input"
                                aria-describedby="inputGroup-sizing-lg"
                              />
                            </div>
                            <div className="col-6">
                              الي
                              <input
                                name="to_date"
                                type="date"
                                className="form-control rounded-pill "
                                aria-label="Sizing  input"
                                aria-describedby="inputGroup-sizing-lg"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-6">
                          المكان
                          <input
                            name="place"
                            type="text"
                            className="form-control rounded-pill p-1"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing"
                          />
                        </div>

                        <div className="col-4">
                          حالة التذاكر:
                          <select
                            name="state"
                            className="form-control rounded-pill"
                          >
                            {[...ticket_status.entries()].map((v, idx) => (
                              <option value={v[0]}>{v[1]}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4">
                          الحل:
                          <select
                            name="solution"
                            className="form-control rounded-pill"
                          >
                            <option value={""}>-</option>
                            {solutions.map((v, idx) => (
                              <option value={v.id}>{v.solution}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4">
                          البرج:
                          <select
                            name="tower"
                            className="form-control rounded-pill"
                          >
                            <option value={""}>-</option>
                            {towers.map((v, idx) => (
                              <option value={v.id}>{v.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-4">
                          السكتور:
                          <select
                            name="sector"
                            className="form-control rounded-pill"
                          >
                            <option value={""}>-</option>
                            {sectors
                              .filter((v) => v.tower == this.state.tower)
                              .map((v, idx) => (
                                <option value={v.id}>{v.name}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="col-4"
                    style={{ "max-height": "300px", overflow: "scroll" }}
                  >
                    {problems.map((v, idx) => (
                      <div class="form-check">
                        <input
                          type="checkbox"
                          name="problem[]"
                          value={v.id}
                          class="form-check-input"
                          id={`problemCheck${v.id}`}
                        />
                        <label
                          class="form-check-label"
                          for={`problemCheck${v.id}`}
                        >
                          {v.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-12 text-center border-top">
                  <button type="submit" class="btn btn-primary">
                    Export
                  </button>
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
  options = [
    { value: "Mis", label: "Misurata" },
    { value: "SIRT", label: "Sirt" },
    { value: "AbuGrain", label: "Abugrin" },
  ];

  constructor(props) {
    super(props);
    this.state = {
      employees: [],
      tickets: [],
      towers: [],
      sectors: [],
      cities: [],
      users: [],
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
      from_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      to_date: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      tower: "",
      sector: "",
      problem: "",
      solution: "",
      sort: "",
      view: "users",
      hasNext: false,
      hasPrev: false,
      loading: true,
      reportExporter: false,
      profiles_filtered: [],
      profiles: [],
      total_users: 0,
    };

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
    this.loadProfiles();
    this.loadUsers();
    console.log("Loading ....");
  }

  loadTickets = () => {
    this.setState({
      hasNext: false,
      hasPrev: false,
    });
    $.ajax(
      `/api/clients/list?q=${this.state.search}&from_date=${this.state.from_date}&to_date=${this.state.to_date}&place=${this.state.place}&state=${this.state.state}&city=${this.state.city}&page=${this.state.page}&tower=${this.state.tower}&sector=${this.state.sector}&problem=${this.state.problem}&solution=${this.state.solution}&fixed_by=${this.state.fixer}&sort_by=${this.state.sort}`,
      {
        success: (res) => {
          let items = [...this.state.tickets, ...res.results];
          all_tickets = items;
          this.setState({
            tickets: items,
            add: false,
            edit: null,
            total: res.count,
            hasNext: res.next != null,
            hasPrev: res.previous != null,
          });
        },
      }
    );
  };

  searchAction = (e) => {
    e.preventDefault();
    this.state.page = 1;
    this.state.tickets = [];
    this.setState({
      page: 1,
      total: 0,
      tickets: [],
      users: [],
    });
    if(this.state.view == "records"){
      
      this.loadTickets();
    }
    if(this.state.view == "users"){
      this.loadUsers();
    }
  };

  changePage = (i) => (e) => {
    e.preventDefault();
    this.state.page = i;
    this.setState({
      page: i,
      total: 0,
    });

    this.loadTickets();
  };

  changePageUsers = (i) => (e) => {
    e.preventDefault();
    this.state.page = i;
    this.setState({
      page: i,
      total: 0,
    });
    this.loadUsers();
    // this.loadTickets()
  };

  loadEmployess = () => {
    $.ajax("/api/clients/employees/list", {
      success: (res) => {
        employees = res.results;
        this.setState({
          employees: employees,
        });
      },
    });
  };

  loadTowers = () => {
    $.ajax("/api/tower/list", {
      success: (res) => {
        towers = res.results;
        this.setState({
          towers: towers,
        });
      },
    });
  };

  loadSectors = () => {
    $.ajax("/api/tower/sectors/list", {
      success: (res) => {
        sectors = res.results;
        this.setState({
          sectors: sectors,
        });
      },
    });
  };

  loadCities = () => {
    $.ajax("/api/clients/cities/list", {
      success: (res) => {
        cities = res.results;
        this.setState({
          cities: cities,
        });
      },
    });
  };

  loadProblems = () => {
    $.ajax("/api/clients/problems/list", {
      success: (res) => {
        problems = res.results;
        this.setState({
          problems: problems,
        });
      },
    });
  };

  loadSolutions = () => {
    $.ajax("/api/clients/solutions/list", {
      success: (res) => {
        solutions = res.results;
        this.setState({
          solutions: solutions,
        });
      },
    });
  };

  event = (type) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[type] = v;
    if (type == "tower") s["sector"] = "";

    this.setState(s);
  };

  removeItem = (e) => {
    this.props.onDelete();
  };

  showAddItemDialog = (e) => {
    this.setState({
      add: true,
      edit: null,
    });
  };

  selectCity = (e) => {
    let city = e.target.value;
    this.state.city = city;
    this.setState({
      profiles_filtered: this.filterProfiles(this.state.profiles),
      city: city,
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

  showUserProfileDialog = (profile) => {
    e.preventDefault();
    this.setState({
      userProfile: profile,
    });
  };

  selectItem = (ticket) => {
    console.log(ticket);
    this.setState({
      selected: ticket,
      add: true,
    });
  };

  changeFixer = (ticket) => (e) => {
    e.preventDefault();
    let disabled = !(
      userinfo?.user_permissions.find(
        (v) => v.codename == "can_edit_ticket_fixer"
      ) != null
    );
    if (disabled) return;
    console.log(ticket);
    let changeHost = "/clients/change/" + ticket.id;
    $(e.target).attr("disabled", "disabled");
    $.ajax({
      url: changeHost,
      type: "GET",
      data: { new: e.target.value }, //$(this).serialize(),
      cache: false,

      success: (res) => {
        let data = $.parseJSON(res);
        if (data["changed"]) {
        }
        $(e.target).removeAttr("disabled");
        $(e.target).removeClass("border-danger");
        $(e.target).addClass("border-success");
        console.log(res);
      },
      error: (error, textStatus, errorThrown) => {
        console.log(error);
        console.log(textStatus);
        console.log(errorThrown);
        $(e.target).removeAttr("disabled");
        $(e.target).removeClass("border-success");
        $(e.target).addClass("border-danger");
        alert(
          "Faild to assign ticket " + textStatus + errorThrown + " -- " + error
        );
      },
    });
  };

  addItem = (ticket) => {
    let id = this.state.tickets.findIndex((v, idx) => v.id == ticket.id);
    if (id == "-1") this.state.tickets = [ticket].concat(this.state.tickets);
    else this.state.tickets[id] = ticket;
    // this.loadSockets()
    let useridx = this.state.users.findIndex((v,idx,itms)=> v==this.state.selected);
    this.state.users[useridx].ticket = ticket

    this.setState({
      tickets: this.state.tickets,
      users: this.state.users,
      add: false,
      close: ticket,
      selected: null,
    });
  };

  onDelete = (ticket) => {
    this.state.tickets = this.state.tickets.filter((v) => v.id != ticket.id);
    this.setState({
      tickets: this.state.tickets,
      add: false,
      close: null,
      selected: null,
    });
  };

  profileChanged = (item) => (e) => {
    item.selected = !item.selected;
    this.setState({
      profiles: this.state.profiles,
    });
  };

  filterProfiles = (profiles) => {
    return profiles.filter((itm, idx) => {
      let name = itm.srvname;
      if (this.state.city == "AbuGrain") {
        return name.toLocaleLowerCase().includes("abugrain");
      } else {
        if (this.state.city == "SIRT") {
          return name.toLocaleLowerCase().includes("sirt");
        }
      }
      return (
        !name.toLocaleLowerCase().includes("sirt") &&
        !name.toLocaleLowerCase().includes("abugrain") &&
        !name.toLocaleLowerCase().includes("student")
      );
    });
  };

  loadProfiles = () => {
    let view = this;
    load_profiles((data) => {
      view.setState({
        profiles: data,
        profiles_filtered: this.filterProfiles(data),
      });
    });
  };

  loadUsers() {
    let profiles_filtered = this.state.profiles_filtered.filter(
      (it) => it.selected
    );
    var users_url = `/api/v2/reports/search`; //?q=${query}&page=${this.state.page}${d}`;
    let view = this;
    $.ajax(users_url, {
      data: {
        from_date: this.state.from_date,
        to_date: this.state.to_date,
        q: this.state.search,
        page: this.state.page,
        order_by: this.state.sort,
        profiles: profiles_filtered.map((it) => it.srvid),
      },
      success: (data) => {
        
        view.setState({
          total_users: data.total,
          users: [...this.state.users, ...data.results],
          loading: false,
        });


        // responseListener(data);
      },
    });
  }

  render() {
    // let profiles_filtered = this.filterProfiles(profiles);
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
                        <button
                          type="submit"
                          className="btn btn-light bg-white border-0 rounded-pill"
                          id="inputGroup-sizing-lg"
                        >
                          بحث
                        </button>
                      </div>
                      <div className="col p-0">
                        <input
                          id="mainSearchField"
                          onChange={this.event("search")}
                          name="q"
                          type="text"
                          className="form-control border-0 "
                          value={this.state.search}
                          aria-label="Sizing example input"
                          aria-describedby="inputGroup-sizing-lg"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-3 col-md-auto p-0">
              {/* {% block add_btn %} */}

              <button
                onClick={this.showAddItemDialog}
                
                type="submit"
                className="btn btn-primary border-0 rounded-pill"
                id="inputGroup-sizing-lg"
              >
                + اضافة
              </button>

              
              
            </div>
            <div className="col"></div>
          </div>
        </div>
        <div className="row mb-2">
          <div className="col"></div>
          <div className="col-auto">
            <input
              onChange={this.event("view")}
              type="radio"
              name="options-outlined"
              id="success-outlined"
              value="summary"
              checked={this.state.view == "summary"}
            />
            <label for="success-outlined">ملخص</label>
          </div>
          <div className="col-auto">
            <input
              onChange={this.event("view")}
              type="radio"
              name="options-outlined"
              id="danger-outlined"
              value="users"
              checked={this.state.view == "users"}
            />
            <label for="danger-outlined">الزبائن</label>
          </div>
          <div className="col-auto">
            <input
              onChange={this.event("view")}
              type="radio"
              name="options-outlined"
              id="records"
              value="records"
              checked={this.state.view == "records"}
            />
            <label for="records">التسجيلات</label>
          </div>
          <div className="col"></div>
        </div>
        <div className="row mb-3">
          <div className="col-12">
            {/* <form id="filterForm"> */}
            <div className="container-fluid">
              <div className="row">
               <div className="col">
               <a href={`/clients/report?from_date=${this.state.from_date}&to_date=${this.state.to_date}&q=${this.state.search}`} 
               className="btn btn-outline-primary border-0 rounded-pill" id="inputGroup-sizing-lg">
                تصدير تقرير
              </a>
               </div>
                <div className="col-4">
                  <div className="row">
                    <div className="col-6">
                      من
                      <input
                        name="from_date"
                        type="date"
                        className="form-control rounded-pill"
                        value={this.state.from_date}
                        onChange={this.event("from_date")}
                        aria-label="Sizing example input"
                        aria-describedby="inputGroup-sizing-lg"
                      />
                    </div>
                    <div className="col-6">
                      الي
                      <input
                        name="to_date"
                        type="date"
                        className="form-control rounded-pill "
                        onChange={this.event("to_date")}
                        value={this.state.to_date}
                        aria-label="Sizing  input"
                        aria-describedby="inputGroup-sizing-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-2">
                  ترتيب حسب:
                  <select
                    onChange={this.event("sort")}
                    name="state"
                    className="form-control rounded-pill"
                  >
                    <option value={""}>-</option>

                    {[...sort_by.entries()].map((v, idx) => (
                      <option value={v[0]}>{v[1]}</option>
                    ))}
                  </select>
                </div>

                <div className="col-2">
                  {this.state.view == "records" ? (
                    <div>
                      المكان
                      <input
                        name="place"
                        onChange={this.event("place")}
                        type="text"
                        className="form-control rounded-pill p-1"
                        value={this.state.place}
                        aria-label="Sizing example input"
                        aria-describedby="inputGroup-sizing"
                      />
                    </div>
                  ) : (
                    ""
                  )}
                </div>

                <div className="col-2">
                  {this.state.view == "records" ? (
                    <div>
                      حالة التذاكر:
                      <select
                        onChange={this.event("state")}
                        name="state"
                        className="form-control rounded-pill"
                      >
                        {[...ticket_status.entries()].map((v, idx) => (
                          <option value={v[0]}>{v[1]}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
                {this.state.view == "records" ? (
                  <div className="col-12">
                    <div className="row">
                      <div className="col"></div>
                      <div className="col-2">
                        المشكلة:
                        <select
                          onChange={this.event("problem")}
                          name="state"
                          className="form-control rounded-pill"
                        >
                          <option value={""}>-</option>
                          {problems.map((v, idx) => (
                            <option value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-2">
                        الحل:
                        <select
                          onChange={this.event("solution")}
                          name="state"
                          className="form-control rounded-pill"
                        >
                          <option value={""}>-</option>
                          {solutions.map((v, idx) => (
                            <option value={v.id}>{v.solution}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  ""
                )}
                <input
                  name="q"
                  onChange={this.event("q")}
                  id="secondrySearch"
                  type="hidden"
                  className="form-control rounded-pill p-1"
                  value={this.state.q}
                  aria-label="Sizing example input"
                  aria-describedby="inputGroup-sizing"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-2">
            <div className="row mb-2 border-bottom"></div>

            <div className="row mb-3">
              {/* <div className="col-3">
                                <button className="btn btn-outline-info rounded-pill" onClick={this.export} >Export</button>
                            </div> */}

              <div className="col-12">
                <select
                  onChange={this.selectCity}
                  id="citySelecta"
                  className="form-select rounded-pill"
                >
                  {this.options.map((item, i) => (
                    <option value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {this.state.profiles_filtered.map((item, i) => {
              return (
                <div class="form-check">
                  <input
                    class="form-check-input"
                    onChange={this.profileChanged(item)}
                    checked={item.selected}
                    type="checkbox"
                    value={item.srvid}
                    id={"profile" + item.srvid}
                  />
                  <label class="form-check-label" for={"profile" + item.srvid}>
                    {item.srvname}
                  </label>
                </div>
              );
            })}
          </div>
          <div className="col-10">
            {this.state.view == "records" ? (
              <RecordedClients
                employees={this.state.employees}
                // showEditItemDialog={this.showEditItemDialog}
                changePage={this.changePage}
                tickets={this.state.tickets}
                showDeleteDialog={this.showDeleteDialog}
                showCloseDialog={this.showCloseDialog}
                showReportDialog={this.showReportDialog}
              />
            ) : this.state.view == "summary" ? (
              <SummaryTable
                profiles={this.state.profiles_filtered}
                startDate={this.state.from_date}
                endDate={this.state.to_date}
                users={all_users}
              />
            ) : (
              <ReportView
                total={this.state.total_users}
                sort={this.state.sort}
                profiles={this.state.profiles_filtered}
                startDate={this.state.from_date}
                endDate={this.state.to_date}
                search={this.state.search}
                changePage={this.changePageUsers(this.state.page + 1)}
                showFollowDialog={this.selectItem}
                showCloseDialog={this.showCloseDialog}
                users={this.state.users}
              />
            )}
          </div>
        </div>

        {this.state.close != null ? (
          <CloseTicket
            hide={() => this.setState({ close: null })}
            ticket={this.state.close}
            success={this.addItem}
            employees={this.state.employees}
          />
        ) : (
          ""
        )}
        
        {/* {this.state.selected != null ? <DetailView hide={() => this.setState({ selected: null })} ticket={this.state.selected} /> : ""} */}
        {this.state.add ? (
          <AddDialogView
            user={this.state.selected}
            employees={this.state.employees}
            sectors={this.state.sectors}
            cities={this.state.cities}
            ticket={null}
            hide={() => this.setState({ add: false })}
            success={this.addItem}
          />
        ) : (
          ""
        )}
        {/* {this.state.edit != null ? <AddDialogView user={null} employees={this.state.employees} sectors={this.state.sectors} cities={this.state.cities} ticket={this.state.edit} hide={() => this.setState({ add: false })} success={this.addItem} /> : ""} */}
        {this.state.loading ? <WaitDialogView hide={() => {}} /> : ""}
        {this.state.history != null ? (
          <HistoryOfTicket
            employees={this.state.employees}
            sectors={this.state.sectors}
            cities={this.state.cities}
            ticket={this.state.history}
            hide={() => this.setState({ history: null })}
          />
        ) : (
          ""
        )}
        {this.state.delete != null ? (
          <DeleteTicket
            ticket={this.state.delete}
            success={this.onDelete}
            hide={() => this.setState({ delete: null })}
          />
        ) : (
          ""
        )}
        {this.state.reportExporter ? (
          <ProblemsReportView
            ticket_status={this.state.ticket_status}
            employees={this.state.employees}
            sectors={this.state.sectors}
            cities={this.state.cities}
            ticket={this.state.delete}
            success={this.onDelete}
            hide={() => this.setState({ reportExporter: false })}
          />
        ) : (
          ""
        )}
      </div>
    );
  }
}

// Summary report

function filterUsers() {
  let accountType = "ROL"; //$("#accountType").val();
  let expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - 3);

  let profiles = new Map();
  for (let u in sas_users) {
    let user = sas_users[u];
    let username = user.username;
    let name = user.profile_details.name;

    var nHti = 0;
    var nRol = 0;
    var rolOn = 0;
    var htiOn = 0;

    if (profiles.has(name)) {
      let n = profiles.get(name);
      nHti = n.hti;
      nRol = n.rol;
      rolOn = n.rolOn;
      htiOn = n.htiOn;
    }

    let userExpiration = new Date(user.expiration);
    if (username.indexOf("-") == -1)
      if (username.startsWith(accountType)) {
        nRol = nRol + 1;
        if (userExpiration >= expirationDate) {
          rolOn = rolOn + 1;
        }
      } else {
        nHti = nHti + 1;
        if (userExpiration >= expirationDate) {
          htiOn = htiOn + 1;
        }
      }

    let price = 0;
    let cir = 0;
    let avr = 0;
    if (name in profilesDetails) {
      price = profilesDetails[name].price;
      avr = profilesDetails[name].avr;
      cir = profilesDetails[name].cir;
    }

    profiles.set(name, {
      hti: nHti,
      rol: nRol,
      rolOn: rolOn,
      htiOn: htiOn,
      price: price,
      cir: cir,
      avr: avr,
      totalHTIPrev: 0,
      totalROLPrev: 0,
    });
  }

  function sort_profiles(a, b) {
    let prefixes = new Map();

    prefixes.set("unlimited", 0);
    prefixes.set("optim", 1);
    prefixes.set("HTI", 2);
    prefixes.set("Flexi", 3);
    prefixes.set("Gig", 4);
    prefixes.set("Tip", 5);
    prefixes.set("dedicated", 600);

    function prefix(name) {
      for (let [k, v] of prefixes) {
        if (name.toLowerCase().includes(k.toLowerCase())) {
          return v;
        }
      }
      return 100;
    }

    if (prefix(a[0]) === prefix(b[0])) return 0;

    if (prefix(a[0]) > prefix(b[0])) return 1;
    else return -1;
  }

  for (let [k, v] of profiles) {
    for (let [dk, dv] of Object.entries(profilesDetails)) {
      if (k.toLocaleLowerCase().includes(dk.toLocaleLowerCase())) {
        v.cir = dv.cir;
        v.price = dv.price;
        v.avr = dv.avr;
        profiles.set(k, v);
      }
    }
  }

  filterdProfiles = profiles;
  allProfiles = profiles;
  allProfiles = new Map([...allProfiles.entries()].sort(sort_profiles));
}

function load_users(responseListener) {
  let usersPerPage = 100;
  var users_url = "/api/reports/sas";
  var first_users_url = `${users_url}?page=0&count=${usersPerPage}`;
  $.ajax(first_users_url, {
    success: (data) => {
      let pages = data.last_page; //(data.total / usersPerPage) + 1;
      sas_users.push(...data.data);
      responseListener();
    },
  });
}

function updateProgress(id, val, max = 100, min = 0) {
  let progress = $(`#${id}`);
  let pr = (val / (max - min)) * 100;

  progress.css({
    width: pr + "%",
  });
}

function load_profiles(responseListener) {
  var users_url = "/api/v2/reports/services";
  $.ajax(users_url, {
    success: (data) => {
      profiles = data;

      responseListener(data);
    },
  });
}

function removeTime(d) {
  let date = new Date(d);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function strDate(d) {
  let date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

class NumberInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      disabled: false,
      valueKey: this.props.valueKey,
      profileKey: this.props.profileKey,
      startDate: null,
      endDate: null,
    };
  }

  changeQuantity = (e) => {
    allProfiles.get(this.props.profileKey)[this.props.valueKey] =
      e.target.value;
  };

  render() {
    return (
      <input
        disabled={this.state.disabled}
        className="form-control rounded-pill"
        type="number"
        value={allProfiles.get(this.props.profileKey)[this.props.valueKey]}
        onChange={this.changeQuantity}
      />
    );
  }
}

class ReportRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      checking: true,
      added_before: false,
      ticket:null
    };
  }
  componentDidMount(){
    this.check(this.props.item.username)
  }

  componentWillReceiveProps(newProps) {
    this.check(this.props.item.username)

  }

  check = (account) => {
    let view = this;
    var users_url = `/api/clients/check/${account}`;
    $.ajax(users_url, {
      success: (data) => {
        view.setState({
          checking: false,
          added_before: true,
          ticket: data
        });
      },
      error: (res) => {
        view.setState({
          checking: false,
          added_before: false,
        });
      },
    });
  };

  render() {
    let profile = this.props.item;
    return (
      <tr className={this.state.added_before?"bg-info":""}>
        <th scope="row"> {this.props.num} </th>
        <td> {profile.username}</td>
        <td>
          {" "}
          {profile.firstname} / {profile.lastname}
        </td>
        <td> {profile.phone}</td>
        <td> {strDate(new Date(profile.expiration))}</td>
        <td> {profile.srvname}</td>
        <td> {profile.stoptime != null ? profile.stoptime : "Online"}</td>
        <td>
          {this.state.checking ? (
            <div class="progress">
              <div
                class="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                aria-valuenow="100"
                aria-valuemin="0"
                aria-valuemax="100"
                style={{"width": "100%"}}
              ></div>
            </div>
          ) : this.state.added_before ? (
            <button
              onClick={(e) => this.props.showCloseDialog(this.state.ticket)}
              className="btn btn-link rounded-pill p-0"
            >
              اغلاق
            </button>
          ) : (
            <button
              onClick={(e) => this.props.showFollowDialog(profile)}
              className="btn btn-link rounded-pill p-0"
            >
              متابعة
            </button>
          )}
        </td>
      </tr>
    );
  }
}

class ReportTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: this.props.users,
      count: this.props.count,
    };
    // console.log("From table", this.props.profiles, this.state.profiles)
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      profiles: newProps.profiles,
      count: newProps.count,
      users: newProps.users,
    });
    // console.log("From table", this.props.profiles, this.state.profiles)
  }

  render() {
    return (
      <div>
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Account</th>
              <th scope="col">User</th>
              <th scope="col">Phone</th>
              <th scope="col">Expiration Date</th>
              <th scope="col">Profile</th>
              <th scope="col">Last online</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {this.state.users.map((item, i) => {
              return (
                <ReportRow
                  showFollowDialog={this.props.showFollowDialog}
                  showCloseDialog={this.props.showCloseDialog}
                  key={"report_item_" + i}
                  item={item}
                  ticket={item.hasOwnProperty("ticket")}
                  num={i + 1}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

class SummaryTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      profiles: this.props.profiles,
      users: this.props.users,
      count: this.props.count,
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      profiles: newProps.profiles,
      count: newProps.count,
    });
  }

  filterUsers = (users) => {
    let fromDate = this.props.startDate;
    let toDate = this.props.endDate;
    let search = this.props.search;
    console.log("Filtring", fromDate, toDate);
    let usrs = users.filter((v, idx) => {
      let s = true;
      if (fromDate) {
        s = (removeTime(v.expiration) >= removeTime(fromDate)) & s;
        console.log("Filter from");
      }
      if (toDate) {
        s = (removeTime(v.expiration) <= removeTime(toDate)) & s;
        console.log("Filter to");
      }

      if (search) {
        let r = v.username.includes(search);

        if (v.firstname != null) {
          r = r | v.firstname.includes(search);
        }

        if (v.lastname != null) {
          r = r | v.lastname.includes(search);
        }

        s = s & r;
      }

      // Object.keys(o).some(k => o[k].toLowerCase().includes(string.toLowerCase()));

      return (
        s &
        !all_tickets.map((b) => b.account).includes(v.username) &
        this.props.profiles
          .filter((p) => p.selected)
          .map((p) => p.id)
          .includes(v.profile_details.id)
      );
    });

    if (this.props.sort) {
      let sort = this.props.sort;
      if (sort == "place") {
        // usrs.sort((a,b)=> a.username - b.username)
      }
      if (sort == "date") {
        usrs = usrs.sort(
          (a, b) => new Date(a.expiration) - new Date(b.expiration)
        );
      }
      if (sort == "name") {
      }
      if (sort == "account") {
        usrs = usrs.sort((a, b) => a.username - b.username);
      }
      if (sort == "problem") {
      }
    }

    return usrs;
  };

  render() {
    let users = this.filterUsers(this.props.users);
    var dates = Array.from(
      new Set(users.map((v, idx) => strDate(removeTime(v.expiration))))
    ).sort();
    dates = dates
      .map((v) => new Date(v))
      .sort(function (a, b) {
        return new Date(b) - new Date(a);
      })
      .map((v) => strDate(v))
      .slice(0, this.props.count);

    return (
      <div>
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">#</th>

              <th scope="col">Expiration Date</th>
              <th scope="col">Count</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((item, i) => {
              return (
                <tr>
                  <th scope="row"> {i} </th>
                  <td> {strDate(item)}</td>
                  <td>
                    {" "}
                    {
                      users.filter(
                        (v, idx) =>
                          strDate(removeTime(v.expiration)) == strDate(item)
                      ).length
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

class ReportView extends React.Component {
  constructor(props) {
    super();
    this.state = {
      profiles: props.profiles,
      loading: false,
      city: "",
      users: props.users,
      total: props.total,
      profiles: [],
      page: this.viewPerPage,
      view: "summary",
      endDate: null,
      startDate: null,
      profiles_filtered: [],
    };
  }

  selectViewType = (e) => {
    let v = e.target.value;

    this.setState({
      page: this.viewPerPage,
      view: v,
    });
  };

  setFilterDate = (name) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[name] = v;
    this.setState(s);
  };

  export = (e) => {
    let a = [];
    a.push(["#", "Account", "Name", "Price", "Profile", "Expiration Date"]);

    var i = 1;
    this.state.users.forEach((v) => {
      let price = Number(
        profiles.find((it) => it.id == v.profile_details.id).price
      );
      a.push([
        i,
        v.username,
        v.firstname,
        price,
        profiles.find((it) => it.id == v.profile_details.id).name,
        v.expiration,
      ]);
      i += 1;
    });

    a.push([""]);

    let workbook = XLSX.utils.book_new();
    let sheet = XLSX.utils.aoa_to_sheet(a);

    let style = (fill) => {
      return {
        fill: {
          // bgColor: {rgb: "ffff0000"},
          fgColor: { rgb: fill },
          patternType: "solid",
        },
        font: {
          bold: true,
          color: { rgb: "FFFFFFFF" },
        },
        alignment: {
          horizontal: "center",
        },
      };
    };

    function cell(v, s) {
      return {
        v: v,
        s: s,
      };
    }

    let lastIndex = a.length; // - 5

    sheet["!cols"] = [
      { wch: 4 }, // "characters"
      { wch: 10 }, // "characters"
      { wch: 35 }, // "characters"
      { wch: 10 }, // "characters"
    ];
    sheet["!ref"] = "A1:X" + (lastIndex + 8);
    console.log(sheet["!ref"]);
    XLSX.utils.book_append_sheet(workbook, sheet);
    let wopts = {
      bookType: "xlsx", // File type to generate
      bookSST: false, // Whether to generate Shared String Table or not, the official explanation is that the build speed will decrease if turned on, but there is better compatibility on lower version IOS devices
      type: "binary",
      style: true,
    };

    XLSX.writeFile(workbook, "report.xlsx", wopts);
  };

  render() {
    let users = this.props.users;

    let users_count = users != null ? users.length : 0;
    return (
      <div className="container-fluid">
        <div className="row mt-5">
          <div className="col-12">
            Total {this.props.total}
          </div>
          <div className="col-12">
            <ReportTable
              showFollowDialog={this.props.showFollowDialog}
              showCloseDialog={this.props.showCloseDialog}
              users={users}
              count={this.state.page}
            />
            <div className="row">
              <nav aria-label="Page navigation example">
                <ul className="pagination justify-content-center">
                  <li
                    className={`page-item ${
                      !this.state.page >= users_count ? "disabled" : ""
                    }`}
                  >
                    <a
                      className="page-link"
                      onClick={this.props.changePage}
                      href="#"
                      aria-label="Next"
                    >
                      المزيد
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            {this.state.loading ? (
              <div className="progress">
                <div
                  className="progress-bar progress-bar-striped bg-primary"
                  role="progressbar"
                  style={{ width: "100%" }}
                  aria-valuenow="25"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        {/* <EditDialog onSave={this.saveEdits} show={this.state.showDialog} profiles={this.state.profiles}/> */}
      </div>
    );
  }
}
// Finish summary report

let item = document.getElementById("container");
const e = React.createElement;
ReactDOM.render(e(MainView), item);
