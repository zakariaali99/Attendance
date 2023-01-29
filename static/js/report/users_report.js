let profiles = [];
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
            cir = profilesDetails[name].cir
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
            totalROLPrev: 0
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

        if (prefix(a[0]) === prefix(b[0]))
            return 0;

        if (prefix(a[0]) > prefix(b[0]))
            return 1;
        else
            return -1;
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
    allProfiles = new Map([...allProfiles.entries()].sort(sort_profiles))


}

function load_users(responseListener) {
    let usersPerPage = 100;
    var users_url = "/api/reports/sas";
    var first_users_url = `${users_url}?page=0&count=${usersPerPage}`;
    $.ajax(first_users_url, {
        success: (data) => {

            let pages = data.last_page; //(data.total / usersPerPage) + 1;

            async function f() {
                let finished = 0;
                for (let i = 1; i <= pages; i++) {
                    let url = `${users_url}?page=${i}&count=${usersPerPage}`;
                    $.ajax(url, {
                        success: (data) => {

                            finished += 1;
                            sas_users.push(...data.data);
                            updateProgress("loadingProgress", finished, pages);
                            if (finished >= pages) {
                                responseListener();
                            }
                        }
                    });
                }
            }

            f();
        }
    });
}


function updateProgress(id, val, max = 100, min = 0) {
    let progress = $(`#${id}`);
    let pr = (val / (max - min)) * 100;

    progress.css({
        'width': pr + '%'
    });
}


function load_profiles(responseListener) {
    var users_url = "/api/reports/profiles_details";
    $.ajax(users_url, {
        success: (data) => {
            profiles = data;
            for(let p of profiles)
                p.selected = p.name.toLocaleLowerCase().includes("Dedicated".toLocaleLowerCase())
            responseListener(profiles);
        }
    })
}

function removeTime(d) {
    let date = new Date(d);
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
  }

  

function strDate(d) {
    let date = new Date(d);
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
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
        allProfiles.get(this.props.profileKey)[this.props.valueKey] = e.target.value;
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
        )
    }
}


class ReportRow extends React.Component {
    constructor(props) {
        super(props);

    }


    render() {
        let profile = this.props.item;
        return (
            <tr>
                <th scope="row"> {this.props.num} </th>
                <td> {profile.username}</td>
                <td> {profile.firstname} / {profile.lastname}</td>
                <td> {profile.profile_details.name}</td>
                <td> {profile.expiration}</td>
                <td> {profiles.find((it)=>it.id == profile.profile_details.id).price}</td>
                <td> view (X) / add</td>
                

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
                        <th scope="col">Profile</th>
                        <th scope="col">Expiration Date</th>
                        <th scope="col">Price</th>
                        <th scope="col">Note</th>
                    </tr>
                    </thead>
                    <tbody>
                    {this.props.users.slice(0, this.props.count).map((item, i) => {
                        return (
                            <ReportRow
                                key={"report_item_" + item.id}
                                item={item}
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


    render() {

        var dates = Array.from(new Set(this.props.users.map((v,idx)=>strDate(removeTime(v.expiration))))).sort()
        dates = dates.map((v)=>new Date(v)).sort(function(a,b){
            return new Date(b) - new Date(a);
          }).map((v)=>strDate(v)).slice(0,this.props.count)
        
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
                                <td> {this.props.users.filter((v,idx)=>strDate(removeTime(v.expiration)) == strDate(item) ).length}</td>
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
    options = [
        {value: 'Mis', label: 'Misurata'},
        {value: 'SIRT', label: 'Sirt'},
        {value: 'AbuGrain', label: 'Abugrin'}
    ];
    viewPerPage = 50;
    constructor(props) {
        
        super();
        this.state = {
            profiles: allProfiles,
            loading: false,
            city: "",
            users:[],
            profiles:[],
            page:this.viewPerPage,
            view:"summary",
            endDate: null,
            startDate: null,
        }
    }

    componentDidMount() {
        load_profiles((data) => {
            this.setState({
                profiles:data
            });

        });

    }

    refresh = (e) => {
        this.setState({
            loading:true,
            users:[]
        })
        console.log("Refresh data",e)
        let profiles_filtered = profiles.filter((itm, idx)=>{
            if(this.state.city=="AbuGrain"){
                return itm.name.toLocaleLowerCase().includes("abugrain");
             }else{
                if(this.state.city=="SIRT"){
                    return itm.name.toLocaleLowerCase().includes("sirt");
                 } 
             }
             return !itm.name.toLocaleLowerCase().includes("sirt") && !itm.name.toLocaleLowerCase().includes("abugrain");
            }).filter((itm)=>itm.selected);
        let d="profiles[]="+profiles_filtered.map((it)=>it.id).join("&profiles[]=")
        var users_url = "/api/reports/users?" + d;
        
        $.ajax(users_url, {
            success: (data) => {
                console.log(data);
                // users = data;
                this.setState({
                    users:data.filter((it)=>!it.username.includes("-")),
                    loading:false
                })
                all_users=this.state.users;
                // for(let p of data)
                //     p.selected = p.name.toLocaleLowerCase().includes("Dedicated".toLocaleLowerCase())
                // responseListener(data);
            }
        })
        // this.setState({
        //     profiles: this.filter(this.state.city),
        //     showDialog: false,
        // });
        // this.forceUpdate();
    }

    

    selectCity = (e) => {
        let city = e.target.value;
        // let filterd = this.filter(city);
        this.setState({
            // profiles: new Map(filterd),
            // showDialog: false,
            city: city,
        })
    };


    selectViewType = (e) => {
        let v = e.target.value;
        
        this.setState({
            page: this.viewPerPage,
            view: v,
        })
    };
    

    setFilterDate =(name)=> (e) => {
        let v = e.target.value;
        let s = this.state
        s[name] = v;
        this.setState(s);
    };
    

    export = (e) => {
        
        

            let a = [];
            a.push(["#", "Account", "Name", "Price", "Profile", "Expiration Date",]);
            
            
            var i = 1;
            this.state.users.forEach(v => {
                let price = Number(profiles.find((it)=>it.id == v.profile_details.id).price)
                    a.push([i,v.username, v.firstname ,price, profiles.find((it)=>it.id == v.profile_details.id).name, v.expiration]);
                    i+=1;
            });

            a.push([""])
            
            let workbook = XLSX.utils.book_new();
            let sheet = XLSX.utils.aoa_to_sheet(a);

            let style = (fill) => {
                return {
                    fill: {
                        // bgColor: {rgb: "ffff0000"},
                        fgColor: {rgb: fill},
                        patternType: "solid"
                    },
                    font: {
                        bold: true,
                        color: {rgb: "FFFFFFFF"}
                    },
                    alignment: {
                        horizontal: "center"
                    }
                }
            };

            function cell(v, s) {
                return {
                    v: v, s: s
                }
            }

            let lastIndex = a.length// - 5
            // sheet["A1"] = cell("WIFI", style("FF8F99C5"));
            // sheet["N1"] = cell("ADSL", style("FF98E2C6"));

            // sheet["A" + (lastIndex + 1)] = cell("Users", style("ff134F5C"));
            // sheet["A" + (lastIndex + 2)] = cell("Total active users", style("ff134F5C"));
            // sheet["B" + (lastIndex + 2)] = cell(totalROLOn + totalHTIOn, style("ff134F5C"));

            // sheet["A" + (lastIndex + 3)] = cell("Total active Prev", style("ff134F5C"));
            // sheet["B" + (lastIndex + 3)] = cell(totalROLPrev + totalHTIPrev, style("ff134F5C"));
            
            // sheet["A" + (lastIndex + 4)] = cell("Diff", style("ff134F5C"));
            // sheet["B" + (lastIndex + 4)] = cell((totalROLOn + totalHTIOn)-(totalROLPrev + totalHTIPrev), style("ff134F5C"));

            // sheet["F" + (lastIndex + 1)] = cell("Revenue", style("ffB6D7A8"));
            // sheet["F" + (lastIndex + 2)] = cell("ADSL Revenue", style("ffB6D7A8"));
            // sheet["H" + (lastIndex + 2)] = cell(totalRevenueROL, style("ffB6D7A8"));
            // sheet["I" + (lastIndex + 2)] = cell("Additinal qouta Revenues", style("ffB6D7A8"));
            // sheet["K" + (lastIndex + 2)] = cell(addedRevenueROL, style("ffB6D7A8"));

            // sheet["F" + (lastIndex + 3)] = cell("WIFI Revenue", style("ffB6D7A8"));
            // sheet["H" + (lastIndex + 3)] = cell(totalRevenueHTI, style("ffB6D7A8"));
            // sheet["I" + (lastIndex + 3)] = cell("Additinal qouta Revenues", style("ffB6D7A8"));
            // sheet["K" + (lastIndex + 3)] = cell(addedRevenueHTI, style("ffB6D7A8"));


            // sheet["F" + (lastIndex + 4)] = cell("Giga for dinar Revenue", style("ffB6D7A8"));
            // sheet["H" + (lastIndex + 4)] = cell(gigaForDinarRevenue, style("ffB6D7A8"));

            // sheet["F" + (lastIndex + 5)] = cell("Coffee Revenues", style("ffB6D7A8"));
            // sheet["H" + (lastIndex + 5)] = cell(round(coffeRevenue), style("ffB6D7A8"));

            // sheet["F" + (lastIndex + 5)] = cell("Total Revenue", style("ffB6D7A8"));
            // let total = totalRevenueROL + totalRevenueHTI + addedRevenueHTI + addedRevenueROL + coffeRevenue + gigaForDinarRevenue;
            // sheet["H" + (lastIndex + 5)] = cell(round(total), style("ffB6D7A8"));

            
            // sheet["N" + (lastIndex + 1)] = cell("CIR Bandwidth (mpbs)", style("ffFABB88"));
            // sheet["N" + (lastIndex + 2)] = cell("ADSL Bandwidth", style("ffFABB88"));
            // sheet["P" + (lastIndex + 2)] = cell(round(totalROLCIR / 1024,2), style("ffFABB88"));
            
            // sheet["N" + (lastIndex + 3)] = cell("WIFI Bandwidth", style("ffFABB88"));
            // sheet["P" + (lastIndex + 3)] = cell(round(totalHTICIR / 1024,2), style("ffFABB88"));

            // let g = Number(round( (gigaForDinarRevenue*8*1024)/(30*8*60*60), 2));
            // let coffeeBand = this.state.report.coffee_band;
            
            // sheet["N" + (lastIndex + 4)] = cell("Giga Dianr Bandwidth", style("ffFABB88"));
            // sheet["P" + (lastIndex + 4)] = cell(round(g), style("ffFABB88"));
            
            // sheet["N" + (lastIndex + 5)] = cell("Coffees Bandwidth", style("ffFABB88"));
            // sheet["P" + (lastIndex + 5)] = cell(round(coffeeBand), style("ffFABB88"));
            
            // sheet["N" + (lastIndex + 6)] = cell("Total Bandwidth", style("ffFABB88"));
            // sheet["P" + (lastIndex + 6)] = cell(round((totalHTICIR+totalROLCIR)/1024 +g+coffeeBand), style("ffFABB88"));

            // // ========================= AVR total

            // sheet["R" + (lastIndex + 1)] = cell("AVR Bandwidth (mpbs)", style("ffFABB88"));
            // sheet["R" + (lastIndex + 2)] = cell("ADSL Bandwidth", style("ffFABB88"));
            // sheet["T" + (lastIndex + 2)] = cell(round(totalROLAVR / 1024,2), style("ffFABB88"));

            // sheet["R" + (lastIndex + 3)] = cell("WIFI Bandwidth", style("ffFABB88"));
            // sheet["T" + (lastIndex + 3)] = cell(round(totalHTIAVR / 1024,2), style("ffFABB88"));

            

            // sheet["R" + (lastIndex + 4)] = cell("Giga Dianr Bandwidth", style("ffFABB88"));
            // sheet["T" + (lastIndex + 4)] = cell(g, style("ffFABB88"));

            // sheet["R" + (lastIndex + 5)] = cell("Coffees Bandwidth", style("ffFABB88"));
            // sheet["T" + (lastIndex + 5)] = cell(round(coffeeBand), style("ffFABB88"));

            // sheet["R" + (lastIndex + 6)] = cell("Total AVR Bandwidth", style("ffFABB88"));
            // sheet["T" + (lastIndex + 6)] = cell(round((totalHTIAVR+totalROLAVR)/1024 +g+coffeeBand), style("ffFABB88"));


           
            sheet['!cols'] = [
                {wch: 4}, // "characters"
                {wch: 10}, // "characters"
                {wch: 35}, // "characters"
                {wch: 10}, // "characters"
            ];
            sheet['!ref'] = "A1:X"+(lastIndex+8);
            console.log(sheet['!ref']);
            XLSX.utils.book_append_sheet(workbook, sheet);
            let wopts = {
                bookType: 'xlsx', // File type to generate
                bookSST: false, // Whether to generate Shared String Table or not, the official explanation is that the build speed will decrease if turned on, but there is better compatibility on lower version IOS devices
                type: 'binary',
                style: true
            };


            XLSX.writeFile(workbook, "report.xlsx", wopts);
        
    };

    

    profileChanged = (item) => (e) => {
        item.selected = !item.selected;
        this.setState({
            profiles:this.state.profiles
        })
    };


    filterUsers = (users) => {
        let fromDate = this.state.startDate;
        let toDate = this.state.endDate;
        console.log('Filtring', fromDate, toDate);
        return users.filter((v,idx)=>{
            let s = true;
            if(fromDate){
                s = removeTime(v.expiration) >= removeTime(fromDate) & s;
                console.log("Filter from");
            }
            if(toDate){
                s = removeTime(v.expiration) <= removeTime(toDate) & s;
                console.log("Filter to");
            }
            return s
        })
    };

    

    render() {
        let profiles_filtered = profiles.filter((itm, idx)=>{
            if(this.state.city=="AbuGrain"){
                return itm.name.toLocaleLowerCase().includes("abugrain");
             }else{
                if(this.state.city=="SIRT"){
                    return itm.name.toLocaleLowerCase().includes("sirt");
                 } 
             }
             return !itm.name.toLocaleLowerCase().includes("sirt") && !itm.name.toLocaleLowerCase().includes("abugrain");
            });
            let users = this.filterUsers(this.state.users);
            let users_count = this.state.users ? users.length : 0;
        return (<div className="container-fluid">

            
            <div className="row mt-5">
                
                <div className="col-3">

                <div className="row mb-2 border-bottom">
                    <div className="col">
                        <input onChange={this.selectViewType} type="radio" name="options-outlined" id="success-outlined" value="summary" checked={this.state.view=="summary"}/>
                        <label  for="success-outlined">ملخص</label>
                    </div>
                    <div className="col">
                        <input onChange={this.selectViewType} type="radio" name="options-outlined" id="danger-outlined" value="users" checked={this.state.view=="users"} />
                        <label  for="danger-outlined">الزبائن</label>
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-6">
                        <label htmlFor="startDate">من</label>
                        <input onChange={this.setFilterDate("startDate")} type="date" id="startDate" class="form-control rounded-pill" />
                    </div>
                    <div class="col-6">
                        <label htmlFor="endDate">الي</label>
                        <input onChange={this.setFilterDate("endDate")} type="date" class="form-control rounded-pill" />
                    </div>
                </div>

                    <div className="row mb-3">
                <div className="col-3">
                    <button className="btn btn-outline-info rounded-pill" onClick={this.export} >Export</button>
                </div>

                <div className="col-6">
                    <select onChange={this.selectCity} id="citySelecta" options={this.options}
                            className="form-select rounded-pill">
                        {this.options.map((item, i) => {
                            return <option {...(i == 0) ? "selected" : ""} value={item.value}>{item.label}</option>;
                        })}

                    </select>
                </div>
                <div className="col-3">
                    
                    <button className="btn btn-outline-info rounded-pill" onClick={this.refresh}
                            id="refresh">refresh
                    </button>
                </div>
                </div>
                
                {profiles_filtered.map((item, i) => {
                    return <div class="form-check">
                        <input class="form-check-input" onChange={this.profileChanged(item)} checked={item.selected} type="checkbox" value={item.id} id={"profile"+item.id}/>
                        <label class="form-check-label" for={"profile"+item.id}>
                            {item.name}
                        </label>
                    </div>
                    })}

                </div>
                <div className="col-9">
                    {this.state.view=="summary"?
                    <SummaryTable profiles={this.state.profiles.filter((v,idx)=> v.selected)} users={users} count={this.state.page} />:
                    <ReportTable users={users} count={this.state.page} />}
                    <div className="row">
                        
                        <nav aria-label="Page navigation example">
                    <ul className="pagination justify-content-center">
                       
                        <li className="page-item"><a className="page-link" >{this.state.users.length} / {this.state.total}</a></li>

                        <li className={`page-item ${!this.state.page >= users_count ? "disabled" : ""}`}>
                            <a className="page-link" onClick={(e)=>{ e.preventDefault(); this.setState({page: this.state.page + this.viewPerPage }) }} href="#" aria-label="Next">
                                المزيد <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                    </div>
                    
                    {this.state.loading?
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-striped bg-primary" role="progressbar" style={{"width": "100%"}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>:""
                                }
                </div>

            </div>
            {/* <EditDialog onSave={this.saveEdits} show={this.state.showDialog} profiles={this.state.profiles}/> */}
        </div>);
    }
}


let item = document.getElementById("container");
console.log(item);
const e = React.createElement;
ReactDOM.render(e(ReportView), item);
