var sas_profiles = [];

function randomColor() {
    return "#" + ((1 << 24) * Math.random() | 0).toString(16);
}

function profile(id) {
    for(let p of sas_profiles){
        if(p.srvid == id)
        return p.srvname;
    }
    return "#" ;
}

function formatDate(d) {
    let date = new Date(d)
    return + date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate().toString().padStart(2, 0);
}

class DetailView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            coffee: props.coffee,
            items: null,
            loading: true,
            from: props.from,
            to: props.to,
            // type: "temp",
            // rangeView: 1,
        }

    }

    componentDidMount() {
        this.load(1);
    }

    load = () => {
        let coffee = this.state.coffee;
        let from = this.state.from;
        let to = this.state.to;
        
        var url = `/api/reports/coffee_summary?to=${to}&from=${from}&prefix=${coffee[0]}`;
        // if (range == -1) {
        //     url = `/api/socket/${socket.id}/detail?from=${this.state.from}&to=${this.state.to}`
        // }
        $.ajax(url, {
            success: (res) => {
                let items = res.data;
                console.log(items, res)
                this.setState({
                    items: items,
                    loading: false,
                });
            },
        });
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

                    </div>
                    <div className="row">

                        <div className="col-4">
                            {this.state.coffee}
                        </div>
                    </div>
                    <div className="row text-center">
                        <div className="row">
                            <div className="col">
                                #
                            </div>
                            <div className="col">
                                Profile
                            </div>
                            <div className="col">
                                User
                            </div>
                            <div className="col">
                                IP
                            </div>

                            <div className="col">
                                Date
                            </div>
                        </div>
                        <hr />
                        {!this.state.loading ?
                            this.state.items.map((item, i) => {
                                return <div className="row">
                                    <div className="col">
                                        {i+1}
                                    </div>
                                    <div className="col">
                                        {profile(item[0])}
                                    </div>
                                    <div className="col">
                                        {item[1]}
                                    </div>
                                    <div className="col">
                                        {item[2]}
                                    </div>

                                    <div className="col">
                                        {formatDate(item[3])}
                                    </div>
                                </div>;
                            }) :
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
        if (props.socket != null && typeof props.socket != typeof undefined)
            this.state = {
                socket: props.socket,
                ip: props.socket.ip,
                port: props.socket.port,
                username: props.socket.username,
                password: props.socket.password,
            }
        else
            this.state = {
                socket: null,
                ip: "",
                name: "",
                
            }
    }

    submit = (e) => {
        e.preventDefault();
        console.log("prevented")
        let view = this;
        var url = `/api/socket/add`;
        var method = "POST"
        if (view.props.socket != null) {
            url = `/api/socket/${view.props.socket.id}/edit`
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
                            <div className="col-8">
                                <div class="mb-3">
                                    <label class="form-label">Socket IP:</label>
                                    <input onChange={this.event("ip")} value={this.state.ip} type="text" class="form-control" placeholder="xxx.xxx.xxx.xxx" />
                                </div>
                            </div>
                            <div className="col-4">
                                <div class="mb-3">
                                    <label class="form-label">Socket Port:</label>
                                    <input onChange={this.event("port")} value={this.state.port} type="number" class="form-control" placeholder="xxx" />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-6">
                                <div class="mb-3">
                                    <label class="form-label">Username:</label>
                                    <input onChange={this.event("username")} value={this.state.username} type="text" class="form-control" placeholder="admin" />
                                </div>
                            </div>
                            <div className="col-6">
                                <div class="mb-3">
                                    <label class="form-label">Password:</label>
                                    <input onChange={this.event("password")} value={this.state.password} type="text" class="form-control" placeholder="*****" />
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
        let s = new Date()
        s.setDate(1)
        this.state = {
            sockets: [],
            selected: null,
            add: false,
            loading: true,
            startDate: formatDate(s),
            endDate: formatDate(new Date()),

        }

    }

    componentDidMount() {
        this.loadSockets();
    }

    showDetailDialog = (coffee) => {
        this.setState({
            selected: coffee,
            detail: true,
        });
    }

    loadSockets = () => {
        this.setState({
            loading: true,
        });
        // let coffee = this.state.coffee;
        let from = this.state.startDate;
        let to = this.state.endDate;
        
        $.ajax(`/api/reports/coffee?to=${to}&from=${from}`, {
            success: (res) => {
                let items = res.data;
                this.loadProfiles((profiles) => {
                    sas_profiles = profiles;
                    
                    this.setState({
                        sockets: items,
                        add: false,
                        edit: null,
                        loading: false,
                    });
                });
            },
        });

    }
    loadProfiles = (listener) => {
        $.ajax("/api/reports/coffee_profiles", {
            success: (res) => {
                let items = res.data;
                listener(items);
            },
        });
    }

    loadAll = () => {
        this.loadProfiles((profiles) => {
            this.loadSockets();
        });
    }

    startDateEvent = (e) => {
        let v = e.target.value;
        console.log("Start date", v);
        this.setState({
            startDate: v,
        });
        this.setState({
            startDate: v,
        });
    };
    endDateEvent = (e) => {
        let v = e.target.value;
        this.setState({
            endDate: v,
        });
        this.setState({
            endDate: v,
        })
    };


    removeItem = (e) => {
        this.props.onDelete();
    };


    showAddCoffeeDialog = (e) => {
        this.setState({
            add: true,
            edit: null,
        });
    };

    showEditCoffeeDialog = (socket) => {
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
        this.state.sockets.push(socket);
        this.loadSockets();
        // this.setState({
        //     // sockets: this.state.sockets,
        //     add: false,
        //   });
    };

    render() {
        // let card = this.state.towers;
        var totalPrice = 0;
        var totalCards = 0;
        return (
            <div className="row">
                <div className="col-auto">
                    <p className="mt-0 pt-0">-</p>
                    <button onClick={this.showAddCoffeeDialog} className="btn btn-outline-secondary rounded-pill" id="updateTableProfiles">Add</button>
                    <button onClick={this.showAddCoffeeDialog} className="btn btn-outline-secondary rounded-pill" id="updateTableProfiles">List Saved coffees</button>
                </div>
                <div className="col-2">
                    <div className="">
                        <label htmlFor="coffeeBandwidth" className="form-label"> من:</label>
                        <input type="date" value={this.state.startDate} onChange={this.startDateEvent}
                            className="form-control rounded-pill" id="coffeeBandwidth"
                            placeholder="" />
                    </div>
                </div>
                <div className="col-2">
                    <div className="">
                        <label htmlFor="gigaDinarRevnue" className="form-label">الي:</label>
                        <input type="date" value={this.state.endDate} onChange={this.endDateEvent}
                            className="form-control rounded-pill" id="gigaDinarRevnue"
                            placeholder="" />
                    </div>
                </div>
                <div className="col-auto">
                    <p>-</p>
                    <button className="btn btn-outline-info rounded-pill" onClick={(e)=>{this.loadSockets()}}>Filter</button>
                </div>
                <div className="col-12">
                    <table className="table table-hover table-sm text-center" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th scope="col" className="col-1">#</th>
                                <th scope="col" className="col-2">Name</th>
                                <th scope="col" className="col-2">prefix IP</th>
                                <th scope="col" className="col-1">Total cards</th>
                                {/* <th scope="col" className="col-2">type</th>
                                <th scope="col" className="col-1">Price</th>
                                <th scope="col" className="col-2">Total Price</th> */}
                                <th scope="col" className="col-1">-</th>
                            </tr>
                        </thead>
                    </table>
                    <div style={{ height: '60vh', overflow: 'scroll', width: '100%' }}>

                        <table className="w-100 table table-hover table-sm text-center">
                            <tbody>

                                {this.state.sockets.map((item, i) => {
                                    if (item[3] * item[1])
                                        totalPrice += item[3] * item[1];
                                    totalCards += item[1];

                                    return <tr>
                                        <td className="col-1">{i + 1}</td>
                                        <td className="col-2">{item[0]}</td>
                                        <td className="col-2">{item[0]}</td>
                                        <td className="col-1">{item[1]}</td>
                                        {/* <td className="col-2">{item[2]}</td> */}
                                        {/* <td className="col-1">{item[3]}</td> */}
                                        {/* <td className="col-2">{item[3] * item[1]}</td> */}
                                        <td className="col-1"><a onClick={(e) => { this.showEditCoffeeDialog(item) }}>Edit</a> / <a href="#" onClick={(e) => { this.showDetailDialog(item) }}>View</a></td>
                                    </tr>
                                })}


                                {this.state.loading ?
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="progress">
                                                <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ "width": "100%" }} aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </td>
                                    </tr>
                                    : <tr className="bg-secondary text-white">
                                        <th colSpan={2} scope="row"> </th>
                                        <td> Total:</td>
                                        <td> {totalCards}</td>
                                        {/* <td> {totalPrice}</td> */}
                                        <td> </td>
                                    </tr>}

                            </tbody>
                        </table>
                    </div>
                </div>

                {this.state.selected != null ? <DetailView hide={() => this.setState({ selected: null })} coffee={this.state.selected} from={this.state.startDate} to={this.state.endDate} /> : ""}
                {this.state.add ? <AddDialogView coffee={this.state.edit} hide={() => this.setState({ add: false })} success={this.addItem} /> : ""}
            </div>
        );
    }
}

let item = document.getElementById("container");
const e = React.createElement;
ReactDOM.render(e(MainView), item);