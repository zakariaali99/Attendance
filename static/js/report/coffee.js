var sas_profiles = [];
var list_coffee = [];

function randomColor() {
    return "#" + ((1 << 24) * Math.random() | 0).toString(16);
}

function profile(id) {
    for (let p of sas_profiles) {
        if (p.srvid == id || p.id == id)
            return p;
    }
    return {
        unitprice: 0,
        srvid: 0,
        srvname: "-- Not known --",
    };
}

function coffee(ip) {
    for (let p of list_coffee) {
        if (p.ip_prefix == ip)
            return p;
    }
    return {
        ip_prefix: ip,
        name: "--",
        city: "-- Not known --",
        id: null,
    };
}

function formatDate(d) {
    let date = new Date(d)
    return + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate().toString().padStart(2, 0);
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
        if(this.props.system == "sas4")
            url = `/api/reports/SAS4/coffee_summary?to=${to}&from=${from}&prefix=${coffee[0]}`;
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
                                        {i + 1}
                                    </div>
                                    <div className="col">
                                        {profile(item[0]).srvname}
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
        if (props.coffee != null && typeof props.coffee != typeof undefined){
            let c = coffee(props.coffee[0])
            this.state = {
                coffee: c,
                ip: c.ip_prefix,
                name: c.name,
                city: c.city,
            }
        }else
            this.state = {
                coffee: null,
                ip: "",
                name: "",
                city: "misurata",
            }
    }

    submit = (e) => {
        e.preventDefault();
        
        let view = this;
        var url = `/api/reports/add_coffee`;
        var method = "POST"
        console.log(this.state.coffee,"Hi world")
        if (view.state.coffee != null) {
            if (view.state.coffee.id != null) {
                console.log("Putt")
                url = `/api/reports/coffee/${view.state.coffee.id}/edit`
                method = "PUT"
            }
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
                ip_prefix: this.state.ip,
                name: this.state.name,
                city: this.state.city,
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
                            <div className="col-12 text-center">
                                <h3>Add Coffee</h3>
                            </div>
                            <div className="col-6">
                                <div class="mb-3">
                                    <label className="form-label">IP Prefix:</label>
                                    <input onChange={this.event("ip")} value={this.state.ip} type="text" className="form-control rounded-pill" placeholder="xxx.xxx.xxx.xxx" />
                                </div>
                            </div>
                            <div className="col-6">
                                <div class="mb-3">
                                    <label className="form-label">City:</label>
                                    <select onChange={this.event("city")} id="citySelecta" className="form-select rounded-pill">
                                        <option value="misurata" selected={this.state.city=="misurata"} >Misurata</option>
                                        <option value="abughrain" selected={this.state.city=="abughrain"} >Abu ghrain</option>
                                        <option value="sirt" selected={this.state.city=="sirt"}>Sirt</option>
                                        <option value="other" selected={this.state.city=="other"}>Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-12">
                                <div class="mb-3">
                                    <label className="form-label">Name:</label>
                                    <input onChange={this.event("name")} value={this.state.name} type="text" className="form-control rounded-pill" placeholder="HTI coffee" />
                                </div>
                            </div>

                        </div>
                        <div className="row mb-2">
                            <div className="col">
                                <button onClick={this.saveEdits} className="btn btn-outline-info rounded-pill" >Save
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

class CoffeesView extends React.Component {
    constructor(props) {
        super(props);
        let s = new Date()
        let e = new Date()
        s.setDate(1)
        e.setDate(e.getDate()+1)
        this.state = {
            sockets: [],
            search: "",
            selected: null,
            add: false,
            ip: null,
            loading: true,
            startDate: formatDate(s),
            endDate: formatDate(e),

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

        let from = this.state.startDate;
        let to = this.state.endDate;
        var url = `/api/reports/coffee?to=${to}&from=${from}`
        if(this.props.system == "sas4")
            url = `/api/reports/SAS4/coffee?to=${to}&from=${from}`

        $.ajax(url, {
            success: (res) => {
                let items = res.data;
                this.loadProfiles((profiles) => {
                    sas_profiles = profiles;

                    this.setState({
                        sockets: items,
                        add: false,
                        list: false,
                        edit: null,
                        loading: false,
                    });
                });
            },
        });

    }

    loadData = (from, to,success) =>{
        

        // let from = this.state.startDate;
        // let to = this.state.endDate;
        var url = `/api/reports/coffee?to=${to}&from=${from}`
        if(this.props.system == "sas4")
            url = `/api/reports/SAS4/coffee?to=${to}&from=${from}`

        $.ajax(url, {
            success: (res) => {
                let items = res.data;
                success(items, from, to);
            },
        });
    }
    monthlyReportExport = async (e) => {
        let dict = new Map()
        let fromDate = new Date(this.state.startDate);
        let endDate = new Date(this.state.endDate);
        
        var selectStartDate = new Date(fromDate);
        var selectEndDate = new Date(fromDate);
        var total = 0;
        console.log("Start data", formatDate(selectStartDate),formatDate(selectEndDate))
        selectEndDate.setMonth(selectStartDate.getMonth()+1);
        selectEndDate.setDate(0);
        console.log(formatDate(selectEndDate));
        function doExport(){
            
            let a = [];
            let keies = [];
            dict.forEach((v,k,m)=>{
                v.forEach((v1,k1,mn)=>{
                    if(!a.includes(k1)){
                        a.push(k1);
                    }
                });

            });
            
            let rows = [["Coffee","Prefix",...a]];

            dict.forEach((v,k,m)=>{
                let row = [coffee(k).name,k,];
                a.forEach((v1,mn)=>{
                    if(v.has(v1)){
                        row.push(v.get(v1));
                    }else{
                        row.push(0);
                    }
                });
                rows.push(row);

            });
            
            let workbook = XLSX.utils.book_new();
            let sheet = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, sheet);
            let wopts = {
                bookType: 'xlsx', // File type to generate
                bookSST: false, // Whether to generate Shared String Table or not, the official explanation is that the build speed will decrease if turned on, but there is better compatibility on lower version IOS devices
                type: 'binary',
                style: true
            };


            XLSX.writeFile(workbook, "report_cards.xlsx", wopts);
        }
        while(selectEndDate <= endDate && selectStartDate < endDate ){
            // if(doRequest == true){
                // doRequest = false;
                total+=1;
                console.log("Loading data", formatDate(selectStartDate),formatDate(selectEndDate))
                this.loadData(formatDate(selectStartDate), formatDate(selectEndDate),(data, fromDate, toDate)=>{
                    
                    total-=1;
                    console.log("Finished ", total);
                    for(var i of data){
                        if(!dict.has(i[0])){
                            dict.set(i[0], new Map())
                        }
                        dict.get(i[0]).set(fromDate + ">" + toDate, i[1]);
                    }
                    if(total <= 0){
                        doExport();
                    }
                })
                selectStartDate=new Date(selectStartDate.getFullYear(),selectStartDate.getMonth()+1,1);
                // selectStartDate.setDate(1);
                selectEndDate= new Date(selectStartDate.getFullYear(), selectStartDate.getMonth()+1,0);
                if(selectEndDate > endDate){
                    selectEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                    console.log(formatDate(selectEndDate));
                }
                // selectEndDate.setMonth(selectEndDate.getMonth())
                // selectEndDate.setDate(0);
                    
            // }
        }

        
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
    searchEvent = (e) => {
        let v = e.target.value;
        this.setState({
            search: v,
        });
        
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

    showListCoffeeDialog = (e) => {
        this.setState({
            add: false,
            edit: null,
            list: true,
        });
    };

    showEditCoffeeDialog = (socket) => {
        // this.state.ip
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

    addItem = (coffee) => {
        console.log(coffee);
        let selected = list_coffee.find((v,i)=> v.id == coffee.id)
        if(selected == null)
            list_coffee.push(coffee);
        else{
            selected.name = coffee.name;
            selected.ip_prefix = coffee.ip_prefix;
        }
        this.setState({
            add: false,
        });
    };

    render() {
        
        var totalPrice = 0;
        var totalCards = 0;

        let items = this.state.sockets.filter((v,i)=>v.name)
        return (
            <div className="row">
                <div className="col-auto">
                    <p className="mt-0 pt-0">-</p>
                    <button onClick={this.showAddCoffeeDialog} className="btn btn-outline-secondary rounded-pill" >Add</button>
                    <button onClick={this.showListCoffeeDialog} className="btn btn-outline-secondary rounded-pill" >List Saved coffees</button>
                    <button onClick={this.monthlyReportExport} className="btn btn-outline-secondary rounded-pill" >Export monthly report</button>
                    
                    
                </div>
                <div className="col"/>
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
                    <button className="btn btn-outline-info rounded-pill" onClick={(e) => { this.loadSockets() }}>Filter</button>
                </div>

                <div className="col-12 row pt-3">
                <div className="col-2"></div>
                <div className="col-8">
                    <div className="">
                        <input type="text" value={this.state.search} onChange={this.searchEvent}
                            className="form-control rounded-pill" id="gigaDinarRevnue"
                            placeholder="Search" />
                    </div>
                </div>
                </div>
                <div className="col-2"></div>
                <div className="col-12 mt-4">
                    <table className="table table-hover table-sm text-center" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th scope="col" className="col-1">#</th>
                                <th scope="col" className="col-2">Name</th>
                                <th scope="col" className="col-2">prefix IP</th>
                                <th scope="col" className="col-1">Total cards</th>
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
                                        <td className="col-2">{coffee(item[0]).name}</td>
                                        <td className="col-2">{item[0]}</td>
                                        <td className="col-1">{item[1]}</td>
                                        <td className="col-1"><a href="#" onClick={(e) => { this.showEditCoffeeDialog(item) }}>Edit</a> / <a href="#" onClick={(e) => { this.showDetailDialog(item) }}>View</a></td>
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

                {this.state.list ? <ListCoffeesView hide={() => this.setState({ list: false })} /> : ""}
                {this.state.selected ? <DetailView system={this.props.system} hide={() => this.setState({ list: false })} hide={() => this.setState({ selected: null })} coffee={this.state.selected} from={this.state.startDate} to={this.state.endDate} /> : ""}
                {this.state.add ? <AddDialogView coffee={this.state.edit} ip={this.state.ip} hide={() => this.setState({ add: false })} success={this.addItem} /> : ""}
            </div>
        );
    }
}

class ServiceDetailView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            service: props.service,
            items: [],
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
        let service = this.state.service;
        let from = this.state.from;
        let to = this.state.to;
        console.log(service)
        
        var url = `/api/reports/coffee_services_summary?to=${to}&from=${from}&srvid=${service[0]}`;
        if(this.props.system == "sas4")
        url = `/api/reports/SAS4/coffee_services_summary?to=${to}&from=${from}&srvid=${service[0]}`;
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
                                        {i + 1}
                                    </div>
                                    <div className="col">
                                        {profile(item[0]).srvname}{profile(item[0]).name}
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


class CoffeeByServiceView extends React.Component {
    constructor(props) {
        super(props);
        let s = new Date()
        let e = new Date()
        s.setDate(1)
        e.setDate(e.getDate()+1);
        this.state = {
            items: [],
            selected: null,
            add: false,
            loading: true,
            startDate: formatDate(s),
            endDate: formatDate(e),

        }

    }

    componentDidMount() {
        this.load();
    }

    showDetailDialog = (coffee) => {
        this.setState({
            selected: coffee,
            detail: true,
        });
    }

    load = () => {
        this.setState({
            loading: true,
            items: [],
        });
        // let coffee = this.state.coffee;
        let from = this.state.startDate;
        let to = this.state.endDate;
        var url = `/api/reports/coffee_services?to=${to}&from=${from}`;
        if(this.props.system == "sas4")
            url = `/api/reports/SAS4/coffee_services?to=${to}&from=${from}`;

        $.ajax(url, {
            success: (res) => {
                let items = res.data;
                console.log(items)
                console.log("=============");
                this.loadProfiles((profiles) => {
                    sas_profiles = profiles;

                    $.ajax(`/api/reports/list_coffee`, {
                        success: (res) => {
                            // let items = res.results;
                            list_coffee = res.results
                            this.setState({
                                items: items,
                                add: false,
                                edit: null,
                                loading: false,
                            });
                        },
                    });
                });
            },
        });

    }
    loadProfiles = (listener) => {
        var url = "/api/reports/coffee_profiles";
        if(this.props.system == "sas4")
            url = "/api/reports/SAS4/coffee_profiles";
            
        $.ajax( url, {
            success: (res) => {
                let items = res.data;
                console.log(res);
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



    render() {
        // let card = this.state.towers;
        var totalPrice = 0;
        var totalCards = 0;
        return (
            <div className="row">

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
                    <button className="btn btn-outline-info rounded-pill" onClick={(e) => { this.load() }}>Filter</button>
                </div>
                <div className="col-12">
                    <table className="table table-hover table-sm text-center" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th scope="col" className="col-1">#</th>
                                <th scope="col" className="col-2">Profile</th>
                                <th scope="col" className="col-2">Quantity</th>
                                <th scope="col" className="col-1">Price</th>
                                <th scope="col" className="col-1">Total</th>
                                <th scope="col" className="col-1">-</th>
                            </tr>
                        </thead>
                    </table>
                    <div style={{ height: '60vh', overflow: 'scroll', width: '100%' }}>

                        <table className="w-100 table table-hover table-sm text-center">
                            <tbody>

                                {this.state.items.map((item, i) => {
                                    
                                    let p = profile(item[0])
                                    console.log(item, p, sas_profiles)
                                    if (p){
                                        if (p.unitprice * item[1])
                                            totalPrice += p.unitprice * item[1];
                                        if (p.price * item[1])
                                            totalPrice += p.price * item[1];
                                    }
                                    totalCards += item[1];

                                    return <tr>
                                        <td className="col-1">{i + 1}</td>
                                        <td className="col-2">{p.srvname}{p.name}</td>
                                        <td className="col-2">{item[1]}</td>
                                        <td className="col-1">{p.unitprice}{p.price}</td>
                                        <td className="col-1">{p.unitprice * item[1] != NaN ?p.unitprice * item[1]:p.price * item[1]}</td>
                                        <td className="col-1"><a href="#" onClick={(e) => { this.showDetailDialog(item) }}>View</a></td>
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
                                        <th colSpan={1} scope="row"> </th>
                                        <td> Total:</td>
                                        <td> {totalCards}</td>
                                        <td> </td>
                                        <td> {totalPrice}</td>

                                        <td> </td>
                                    </tr>}

                            </tbody>
                        </table>
                    </div>
                </div>

                {this.state.selected != null ? <ServiceDetailView system={this.props.system} hide={() => this.setState({ selected: null })} service={this.state.selected} from={this.state.startDate} to={this.state.endDate} /> : ""}
            </div>
        );
    }
}


class ListCoffeesView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            service: props.service,
            items: [],
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
        let service = this.state.service;
        let from = this.state.from;
        let to = this.state.to;
        console.log(service)
        var url = `/api/reports/list_coffee`;
        // if (range == -1) {
        //     url = `/api/socket/${socket.id}/detail?from=${this.state.from}&to=${this.state.to}`
        // }
        $.ajax(url, {
            success: (res) => {
                let items = res.results;
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
                        <div className="col-12 text-center">
                            <h2>Coffees</h2>
                        </div>
                    </div>
                    <div className="row text-center">
                        <div className="row">
                            <div className="col-1">
                                #
                            </div>
                            <div className="col">
                                Profile
                            </div>
                            <div className="col">
                                User
                            </div>
                            <div className="col">
                                City
                            </div>
                            <div className="col-2">
                                -
                            </div>
                        </div>
                        <hr />
                        {!this.state.loading ?
                            this.state.items.map((item, i) => {
                                return <div className="row">
                                    <div className="col-1">
                                        {i + 1}
                                    </div>
                                    <div className="col">
                                        {item.name}
                                    </div>
                                    <div className="col">
                                        {item.ip_prefix}
                                    </div>
                                    <div className="col">
                                        {item.city}
                                    </div>
                                    <div className="col-2">
                                        Edit / Add
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



class MainView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewType: "byProfile",
        }

    }

    viewTypeEvent = (e) => {
        let v = e.target.value;
        this.setState({
            viewType: v,
        });

    };


    systemEvent = (e) => {
        let v = e.target.value;
        this.setState({
            system: v,
        });

    };



    render() {
        // let card = this.state.towers;
        var totalPrice = 0;
        var totalCards = 0;
        return (
            <div>
                <div className="row">
                    <div className="col-auto">
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="inlineRadioOptions" id="inlineRadio1" onChange={this.viewTypeEvent} value="byProfile" />
                            <label class="form-check-label" for="inlineRadio1">By Profile</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" onChange={this.viewTypeEvent} type="radio" name="inlineRadioOptions" value="byCoffee" id="byCoffee" />
                            <label class="form-check-label" for="byCoffee">By coffee name</label>
                        </div>
                    </div>
                    <div className="col-auto">
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="sas" id="sas4" onChange={this.systemEvent} value="sas4" />
                            <label class="form-check-label" for="sas4">SAS 4</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" onChange={this.systemEvent} type="radio" name="sas" value="sas3" id="sas3" />
                            <label class="form-check-label" for="sas3">SAS 3</label>
                        </div>
                    </div>
                </div>
                {this.state.viewType == "byProfile" ? <CoffeeByServiceView system={this.state.system} /> : <CoffeesView system={this.state.system} />}
            </div>
        );
    }
}



let item = document.getElementById("container");
const e = React.createElement;
ReactDOM.render(e(MainView), item);