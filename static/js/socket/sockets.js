

function randomColor() {
    return "#" + ((1 << 24) * Math.random() | 0).toString(16);
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
        let data = {}
        let timeRanges = [
            { value: 1, name: "1 Hour" },
            { value: 3, name: "3 Hours" },
            { value: 6, name: "6 Hours" },
            { value: 12, name: "12 Hours" },
            { value: 24, name: "1 Day" },
            { value: 48, name: "2 Days" },
            { value: 24 * 4, name: "4 Days" },
            { value: 24 * 7, name: "1 Week" },
            { value: -1, name: "Other" },
        ]

        let items = this.state.details;
        let type = this.state.type;
        if (items != null) {
            let x = [];
            items.forEach((item, i) => {
                if (!x.includes(item.timestamp))
                    x.push(item.timestamp);
            });

            let ports = []
            items.forEach((item, i) => {
                if (!ports.includes(item.port)) {
                    ports.push(item.port);
                }
            });
            let y = ports.map((item, i) => {
                let c = randomColor();
                let values = [];
                x.forEach((ts, i) => {
                    let added = false;
                    items.forEach((portState, i) => {
                        if (ts === portState.timestamp) {
                            if (portState.port === item) {
                                if (type == "temp")
                                    values.push(portState.temperature)
                                else if (type == "voltage")
                                    values.push(portState.voltage)
                                else if (type == "current")
                                    values.push(portState.current)
                                else if (type == "txPower")
                                    values.push(portState.txPower)
                                else if (type == "rxPower")
                                    values.push(portState.rxPower)
                                else
                                    values.push(portState.temperature)
                                added = true;
                            }
                        }
                    });
                    if (!added)
                        values.push(0);
                });
                console.log("Values", values)
                return {
                    label: `Port #${item}`,
                    backgroundColor: c,
                    borderColor: c,
                    data: values
                };
            })

            data = { x: x, y: y }

        }
        let graphData = { id: this.state.socket.id, data: data }
        console.log("Data", graphData, items);

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
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" checked={this.state.type == "temp"} type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio1" value="temperature" />
                                <label class="form-check-label" for="inlineRadio1">Temperature</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio2" value="voltage" />
                                <label class="form-check-label" for="inlineRadio2">voltage</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio3" value="current" />
                                <label class="form-check-label" for="inlineRadio3">current</label>
                            </div>

                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio3" value="txPower" />
                                <label class="form-check-label" for="inlineRadio3">txPower</label>
                            </div>

                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" onClick={this.selectType} name="inlineRadioOptions" id="inlineRadio3" value="rxPower" />
                                <label class="form-check-label" for="inlineRadio3">rxPower</label>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col">
                            <p className="p-0 m-0">Select peroid:</p>
                            {timeRanges.map((r, i) => {
                                return <div class="form-check form-check-inline">
                                    <input type="radio" onClick={(e) => { this.selectViewRange(r.value); }} checked={r.value == this.state.rangeView} id="customRadioInline1" name="range" class="form-check-input" value={r.value} />
                                    <label class="custom-control-label" htmlFor="customRadioInline1">{r.name}</label>
                                </div>;
                            })}

                        </div>
                        <div className="col-4">

                            <form>
                                <div className="row">
                                    <div className="form-group col-6">
                                        <label>From</label>
                                        <input type="date" value={this.state.from} onChange={this.selectFromDate} class="form-control" id="fromDate" placeholder="From" />
                                    </div>
                                    <div className="form-group col-6">
                                        <label>To</label>
                                        <input type="date" value={this.state.to} onChange={this.selectToDate} class="form-control" id="toDate" placeholder="To" />
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
        if (props.coffee != null && typeof props.coffee != typeof undefined)
            this.state = {
                socket: props.coffee,
                ip: props.coffee.ip,
                // port: props.socket.port,
                name: props.coffee.name,
                // password: props.socket.password,
            }
        else
            this.state = {
                socket: null,
                ip: "",
                port: "",
                username: "",
                password: "",
            }
    }

    submit = (e) => {
        e.preventDefault();
        console.log("prevented")
        let view = this;
        var url = `/api/socket/add`;
        var method = "POST"
        if (view.props.coffee != null) {
            url = `/api/socket/${view.props.coffee.id}/edit`
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
                ip: this.state.ip,
                port: this.state.port,
                username: this.state.username,
                password: this.state.password,
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



    render() {


        return (
            <div className={"over-layer show"} id="externalDataScreen">
                <div className={"over-layer show"} onClick={this.props.hide} />
                <div className='content bg-white'>
                    <form onSubmit={this.submit}>
                        <div className="row">
                            <div className="col-12">
                                <div class="mb-3">
                                    <label class="form-label">Coffee IP prefix:</label>
                                    <input onChange={this.event("ip")} value={this.state.ip} type="text" class="form-control" placeholder="xxx.xxx.xxx.xxx" />
                                </div>
                            </div>
                            <div className="col-12">
                                <div class="mb-3">
                                    <label class="form-label">Coffee Name:</label>
                                    <input onChange={this.event("name")} value={this.state.name} type="number" class="form-control" placeholder="xxx" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="row mb-2">
                            <div className="col">
                                <button onClick={this.saveEdits} className="btn btn-outline-info" id="updateTableProfiles">Save
                                </button>
                            </div>

                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

class GraphView extends React.Component {
    charts = null;
    componentDidMount() {
        let item = this.props.item;
        console.log(document.getElementById('chart' + item.id))

        // const ctx = document.getElementById('chart'+this.props.id).getContext('2d');
        const ctx = document.getElementById('chart' + this.props.id);
        const labels = item.data.x
        const data = {
            labels: labels,
            datasets: item.data.y
        };
        const config = {
            type: 'line',
            data: data,
        };
        this.charts = new Chart(ctx, config);
    }
    componentDidUpdate(prevProps) {
        // if (prevProps.text !== this.props.text) {
        //   this.updateAndNotify();
        // }
        let item = this.props.item;
        this.charts.data.datasets = item.data.y
        this.charts.update();
    }

    render() {
        // return (<div id={"chart"+this.props.id}/>);
        // return (<canvas id={"chart"+this.props.id} width="400" height="400"></canvas>);
        return (<canvas id={"chart" + this.props.id} ></canvas>);
    }
}

class MainView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sockets: [],
            selected: null,
            add: false,
        }

    }

    componentDidMount() {
        this.loadSockets();
    }

    loadSockets = () => {
        $.ajax("/api/socket/list", {
            success: (res) => {
                let items = res.results;
                this.setState({
                    sockets: items,
                    add: false,
                    edit: null,
                });
            },
        });
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

    showEditItemDialog = (socket) => {
        this.setState({
            add: true,
            edit: socket,
        });
    };

    selectItem = (socket) => {
        console.log(socket);
        this.setState({
            selected: socket,
        });
    };

    addItem = (socket) => {
        // console.log(socket);
        this.state.sockets.push(socket)
        this.loadSockets()
        // this.setState({
        //     // sockets: this.state.sockets,
        //     add: false,
        //   });
    };

    render() {
        // let card = this.state.towers;
        return (
            <div className="row">
                <div className="col-12 my-3">
                    <button onClick={this.showAddItemDialog} className="btn btn-outline-secondary rounded-pill" id="updateTableProfiles">Add</button>
                </div>
                {this.state.sockets.map((item, i) => {
                    return <div className="col-4 px-1">
                        <div className="card rounded-0">
                            <div className="card-body">
                                <h5 className="card-title">{item.name}</h5>
                                <p className="card-text">{item.ip}:{item.port}</p>
                                <table className="table table-hover table-sm text-center">
                                    <thead>
                                        <tr>
                                            <th scope="col">Port</th>
                                            <th scope="col">T</th>
                                            <th scope="col">WL</th>
                                            <th scope="col">V(rx)</th>
                                            <th scope="col">V(tx)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {item.last_state.map((state, _) => {
                                            return <tr>
                                                <td>#{state.port}</td>
                                                <td>{state.temperature}</td>
                                                <td>{state.wavelength}</td>
                                                <td>{state.rxPower}</td>
                                                <td>{state.txPower}</td>

                                            </tr>
                                        })}
                                    </tbody>
                                </table>

                                <a href="#" onClick={(e) => { this.selectItem(item) }} className="btn border-0">Details</a>
                                <a href="#" onClick={(e) => { this.showEditItemDialog(item) }} className="btn border-0">Edit</a>
                            </div>
                        </div>
                    </div>
                })}
                {this.state.selected != null ? <DetailView hide={() => this.setState({ selected: null })} socket={this.state.selected} /> : ""}
                {this.state.add ? <AddDialogView socket={this.state.edit} hide={() => this.setState({ add: false })} success={this.addItem} /> : ""}
            </div>
        );
    }
}

let item = document.getElementById("container");
const e = React.createElement;
ReactDOM.render(e(MainView), item);