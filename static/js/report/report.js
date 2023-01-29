let profiles = [];
var all_users = [];
var sas_users = [];
var filterdProfiles = new Map();
var allProfiles = new Map();
var profilesDetails = new Map();

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
    var users_url = "/api/reports/profiles_initial";
    $.ajax(users_url, {
        success: (data) => {


            profilesDetails = data;
            responseListener(data);
        }
    })
}

class NumberInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            disabled: false,
            valueKey: this.props.valueKey,
            profileKey: this.props.profileKey,
        };
    }

    changeQuantity = (e) => {
        allProfiles.get(this.props.profileKey)[this.props.valueKey] = e.target.value;
        // this.setState({
        //     value: e.target.value,
        //     disabled: this.props.disabled
        // });
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

    changeQuantity = (e) => {
        billItems[this.props.num].current_quantity = e.target.value;
        this.setState({
            quantity: e.target.value,
            disabled: this.props.disabled
        });
    };
    removeItem = (e) => {
        // billItems.pop(this.props.num);
        this.props.onDelete();
    };

    render() {
        let profile = allProfiles.get(this.props.num);
        let total = profile.rolOn + profile.htiOn;
        let totalCIR = profile.cir * total;
        if (this.props.num.includes("5G-5L")) {
            totalCIR = users_traffic.map((item, i) => item[1].total_real.reduce((p, c) => p + c, 0), 0).reduce((p, c) => p + c, 0);
            console.log("total cir of 5g5lyd", totalCIR)

        }
        return (
            <tr>
                <th scope="row"> {this.props.num} </th>
                <td> {profile.price}</td>
                <td> {profile.hti}</td>
                <td> {profile.totalHTIPrev}</td>
                <td> {profile.rol}</td>
                <td> {profile.totalHTIPrev}</td>
                <td> {profile.htiOn}</td>
                <td> {profile.rolOn}</td>

                <td> {profile.cir}</td>
                <td> {round(totalCIR / 1024)}</td>

                <td> {profile.avr}</td>
                <td> {round(profile.avr * total / 1024)}</td>
                <td> {total * profile.price}</td>

            </tr>
        );
    }
}


class ReportTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            profiles: this.props.profiles,
        };
        // console.log("From table", this.props.profiles, this.state.profiles)
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            profiles: newProps.profiles,
        });
        // console.log("From table", this.props.profiles, this.state.profiles)
    }


    render() {
        let hti = 0;
        let rol = 0;
        let htiOn = 0;
        let rolOn = 0;
        // let hti=0
        let cir = 0;
        let cirTotal = 0;
        let avr = 0;
        let avrTotal = 0;
        let totalHTIPrev = 0;
        let totalROLPrev = 0;
        let revenue = 0;

        for (const [k, v] of this.state.profiles) {
            hti += v.hti;
            rol += v.rol;
            let total = v.htiOn + v.rolOn;
            htiOn += v.htiOn;
            rolOn += v.rolOn;
            cir += v.cir;
            cirTotal += v.cir * total;
            avr += v.avr;
            avrTotal += v.avr * total;
            totalHTIPrev += v.totalHTIPrev;
            totalROLPrev += v.totalROLPrev;
            revenue += v.price * total;

        }
        return (
            <div>
                <table className="table table-hover">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Price</th>
                        <th scope="col">WIFI</th>
                        <th scope="col">WIFI Total Prev</th>
                        <th scope="col">ADSL</th>
                        <th scope="col">ADSL Total Prev</th>
                        <th scope="col">WIFI Active</th>
                        <th scope="col">ADSL Active</th>
                        <th scope="col">CIR</th>
                        <th scope="col">CIR total</th>
                        <th scope="col">AVR</th>
                        <th scope="col">AVR total</th>
                        <th scope="col">Revenues</th>
                    </tr>
                    </thead>
                    <tbody>
                    {[...this.state.profiles.entries()].map((item, i) => {

                        return (
                            <ReportRow
                                disabled={this.state.disabled}
                                onDelete={this.refresh}
                                key={"report_item_" + item[0]}
                                num={item[0]}
                            />
                        );
                    })}
                    <tr className="bg-secondary text-white">
                        <th colSpan={2} scope="row"> Total</th>

                        <td> {hti}</td>
                        <td> {totalHTIPrev}</td>
                        <td> {rol}</td>
                        <td> {totalHTIPrev}</td>
                        <td> {htiOn}</td>
                        <td> {rolOn}</td>

                        <td> {Math.round(cir / 1024)}</td>
                        <td> {Math.floor(cirTotal / 1024)}</td>

                        <td> {Math.round(avr / 1024)}</td>
                        <td> {Math.round(avrTotal / 1024)}</td>
                        <td> {revenue}</td>

                    </tr>

                    </tbody>
                </table>
            </div>
        );
    }
}

class EditDialog extends React.Component {

    constructor(props) {
        super(props);
        this.profiles = this.props.profiles;
        this.state = {
            profiles: this.profiles,
            show: this.props.show,
            skipHead: true
        }
    }

    componentWillReceiveProps(newProps) {
        this.profiles = newProps.profiles;
        // console.log("Dialog profiles", this.profiles);
        this.setState({
            profiles: this.profiles,
            show: newProps.show,
        });
    }

    hide = (e) => {
        this.setState({
            profiles: this.props.profiles,
            show: false
        });
    };
    skipHeaderEvent = (e) => {
        this.setState({
            skipHead: e.target.checked
        })
    };
    load_workbook = (data) => {
        // console.log(data, new Date());
        let wb = XLSX.read(data, {type: "array"});
        this.process_workbook(wb);
        // console.log(wb);
    };


    process_workbook = (workbook) => {
        var first_sheet_name = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[first_sheet_name];
        // console.log("Worksheet", worksheet);
        let rows = worksheet["!ref"].split(":")[1];
        let row = Number(rows.match("[0-9]+")[0]);
        let skipHeader = $("#skipHeader").prop("checked");
        let start = 1;
        if (skipHeader)
            start += 1;

        for (let i = start; i <= row; i++) {
            if (!worksheet.hasOwnProperty("A" + i)) {
                continue;
            }

            let name = worksheet["A" + i].v;
            // console.log("This is the main file", name);


            if (worksheet.hasOwnProperty("B" + i)) {
                this.profiles.get(name).price = worksheet["B" + i].v
            }
            if (worksheet.hasOwnProperty("C" + i)) {
                this.profiles.get(name).cir = worksheet["C" + i].v;
            }
            if (worksheet.hasOwnProperty("D" + i)) {
                this.profiles.get(name).avr = worksheet["D" + i].v;
            }
            if (worksheet.hasOwnProperty("E" + i)) {
                this.profiles.get(name).hti = worksheet["E" + i].v;
            }
            if (typeof worksheet.hasOwnProperty("F" + i)) {
                this.profiles.get(name).rol = worksheet["F" + i].v;
            }
            // {% comment %} console.log(name, wifi, adsl, price, cir, avr) {% endcomment %}
        }
    };
    loadExcel = (e) => {
        let importFile = $(e.target);
        var files = importFile.prop("files");
        let file = files[0];
        let reader = new FileReader();
        reader.onload = (load_e) => {
            let data = load_e.target.result;
            try {
                this.load_workbook(data);
            } catch (er) {
                console.log(er);
            }

            importFile.val("");
            importFile.prop("files", null);

        };
        reader.readAsArrayBuffer(file);


    };

    changeValue = (profile, key, value) => {
        this.profiles.get(profile)[key] = Number(value);
        this.setState({
            profiles: this.profiles
        })
    };

    saveEdits = () => {
        this.props.onSave(this.profiles)
    };

    render() {
        return (
            <div className={this.state.show ? "over-layer show" : "over-layer"} id="externalDataScreen">
                <div className='content'>
                    <div className="row mb-2">
                        <div className="col"/>
                        <div className="col-auto">
                            <button className="btn" onClick={this.hide}>X</button>
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-auto">
                            <div className="mb-3">
                                <label htmlFor="importFile" className="form-label">Import: </label>
                                <input onChange={this.loadExcel} className="form-control form-control-sm"
                                       id="importFile" type="file"/>
                                <p>
                                    Column order: Name, Price, CIR, AVR, Prev wifi users, Prev ADSL users.
                                </p>
                            </div>
                        </div>
                        <div className="col-auto">
                            <br/>
                            <input onChange={this.skipHeaderEvent} type="checkbox" name="skipHeader" id="skipHeader"/>
                            <label htmlFor="skipHeader">Skip header.</label>
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-3">#</div>
                        <div className="col">Current WIFI</div>
                        <div className="col">Current ROL</div>
                        <div className="col">Price</div>
                        <div className="col">CIR</div>
                        <div className="col">Average</div>
                        <div className="col">Prev WIFI</div>
                        <div className="col">Prev ROL</div>
                    </div>

                    <div className="container-fluid" id="externalDataScreenContent">
                        {[...this.state.profiles.entries()].map((item, i) => {
                            let key = item[0];
                            let v = item[1];

                            return <div className="row mb-2">
                                <div className="col-3">{key}</div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "hti", e.target.value)
                                    }} id={"totalHTI" + key} value={v.hti} type="number" className="form-control"
                                           placeholder="Price"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "rol", e.target.value)
                                    }} id={"totalROL" + key} value={v.rol} type="number" className="form-control"
                                           placeholder="Price"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "price", e.target.value)
                                    }} id={"price" + key} value={v.price} type="number" className="form-control"
                                           placeholder="Price"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "cir", e.target.value)
                                    }} min='0' id={"cir" + key} value={v.cir} type="number" className="form-control"
                                           placeholder="CIR"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "avr", e.target.value)
                                    }} id={"avr" + key} value={v.avr} type="number" className="form-control"
                                           placeholder="AVR"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "totalHTIPrev", e.target.value)
                                    }} id={"prevHTI" + key} value={v.totalHTIPrev} type="number"
                                           className="form-control" placeholder="AVR"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "totalROLPrev", e.target.value)
                                    }} id={"prevROL" + key} value={v.totalROLPrev} type="number"
                                           className="form-control" placeholder="AVR"/>
                                </div>
                            </div>
                        })}
                    </div>
                    <div className="row mb-2">
                        <div className="col">
                            <button onClick={this.saveEdits} className="btn btn-info" id="updateTableProfiles">Update
                            </button>
                        </div>

                    </div>
                </div>
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

    constructor(props) {
        super();
        this.state = {
            profiles: allProfiles,
            showDialog: false,
            city: "",
            wifiAdded: 0,
            adslAdded: 0,
            coffee: 0,
            gigaDinar: 0,
            coffeeBand: 0,
            gigaDinarTraffic: 0

        }
    }

    componentDidMount() {
        let table = this;
        let loadingScreen = $("#waitingScreen");
        showTable();
        load_profiles((data) => {
            load_users(() => {
                filterUsers();
                let gigaDinar = sas_users.filter((item, i) => {
                    return item.profile_details.name.toLocaleLowerCase().includes("5g-5");
                });
                load_all_user_traffic(gigaDinar, (progress, f) => {
                    console.log(`loading traffic: ${progress} ----> ${f}`)
                }, (data) => {
                    console.log(`loading traffic: Finish`, data);
                    users_traffic = data;
                    this.refresh();
                });
                loadingScreen.removeClass("show");
                table.refresh();


            });
        });

    }

    refresh = () => {
        this.setState({
            profiles: this.filter(this.state.city),
            showDialog: false,
        });
        this.forceUpdate();
    };

    filter = (city) => {
        return new Map([...allProfiles.entries()].filter((i) => {
            let add = false;
            let k = i[0];
            if (city == "SIRT") {
                add = k.startsWith("SIRT")
            } else if (city == "AbuGrain") {
                add = k.startsWith(city)
            } else {
                add = !k.startsWith("SIRT") & !k.startsWith("AbuGrain")
            }
            return add;
        }));
    };

    selectCity = (e) => {
        let city = e.target.value;
        let filterd = this.filter(city);
        this.setState({
            profiles: new Map(filterd),
            showDialog: false,
            city: city,
        })
    };

    coffeeBandwidth = (e) => {
        let v = e.target.value;
        coffeeBandWidth = Number(v);
        this.setState({
            coffeeBand: coffeeBandWidth,
        })
    };

    gigaDinarEvent = (e) => {
        let v = e.target.value;
        gigaDinar = Number(v);
        this.setState({
            gigaDinar: gigaDinar,
        })
    };

    coffeeEvent = (e) => {
        let v = e.target.value;
        coffe = Number(v);
        this.setState({
            coffee: coffe,
        })
    };

    adslEvent = (e) => {
        let v = e.target.value;
        adslAdded = Number(v);
        this.setState({
            adslAdded: adslAdded,
        })
    };

    wifiEvent = (e) => {
        let v = e.target.value;
        wifiAdded = Number(v);
        this.setState({
            wifiAdded: wifiAdded
        })
    };
    gigaDianUsage = (e) => {
        let city = this.state.city;
        let users = sas_users.filter((item, i) => {
            if (city == "SIRT") {
                return item.profile_details.name.toLocaleLowerCase().includes("5g-5")
                    & !item.profile_details.name.toLocaleLowerCase().includes("sirt")
            } else if (city == "AbuGrain") {
                return item.profile_details.name.toLocaleLowerCase().includes("5g-5")
                    & !item.profile_details.name.toLocaleLowerCase().includes("abugrain")
            }
            return item.profile_details.name.toLocaleLowerCase().includes("5g-5")
                & !item.profile_details.name.toLocaleLowerCase().includes("ab")
                & !item.profile_details.name.toLocaleLowerCase().includes("sirt");
        }).map((item, i) => item.id);
        let traffic = users_traffic.filter((item, i) => users.includes(item[0])).reduce((p, c) => p + c, 0);
        console.log("Traffic from usage function", traffic);

        // this.setState({
        //     gigaDinarTraffic: traffic
        // });
        return traffic;
    };

    showEditDialog = (e) => {
        this.setState({
            showDialog: true
        })
    };

    saveEdits = (profiles) => {
        console.log("save edits", profiles);
        for (let [prof, v] of profiles) {
            for (let [k, value] of Object.entries(v)) {
                allProfiles.get(prof)[k] = value
            }
        }
        this.refresh()

    };

    render() {
        return (<div className="container-fluid">
            <div className="row">
                <div className="col-auto">
                    <button className="btn btn-outline-info rounded-pill" onClick={exportExcel}>Export</button>
                </div>
                <div className="col-auto">
                    <button className="btn btn-outline-info rounded-pill" onClick={this.showEditDialog}
                            id="editData">Edit
                    </button>
                </div>

                <div className="col-2">
                    <select onChange={this.selectCity} id="citySelecta" options={this.options}
                            className="form-select rounded-pill">
                        {this.options.map((item, i) => {
                            return <option {...(i == 0) ? "selected" : ""} value={item.value}>{item.label}</option>;
                        })}

                    </select>
                </div>
                <div className="col-auto">
                    {/* <button className="btn btn-primary rounded-pill" onClick={}>Filter</button> */}
                </div>
                <div className="row mb-2">
                    <div className="col-2"></div>
                    <div className="col-2">
                        <div className="mb-3">
                            <label htmlFor="coffeeBandwidth" className="form-label">النطاق المستخدك في المقاهي
                                )MP(:</label>
                            <input type="number" value={this.state.coffeeBand} onChange={this.coffeeBandwidth}
                                   className="form-control rounded-pill" id="coffeeBandwidth"
                                   placeholder=""/>
                        </div>
                    </div>
                    <div className="col-2">
                        <div className="mb-3">
                            <label htmlFor="gigaDinarRevnue" className="form-label">ايرادات باقة الجيجا بدينار</label>
                            <input type="number" value={this.state.gigaDinar} onChange={this.gigaDinarEvent}
                                   className="form-control rounded-pill" id="gigaDinarRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                    <div className="col-2">
                        <div className="mb-3">
                            <label htmlFor="coffeCardsRevnue" className="form-label">إرادات كروت المقاهي</label>
                            <input type="number" value={this.state.coffee} onChange={this.coffeeEvent}
                                   className="form-control rounded-pill" id="coffeCardsRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                    <div className="col-2">
                        <div className="mb-3">
                            <label htmlFor="addedADSLRevnue" className="form-label">الحصة الاضافية ADSL</label>
                            <input type="number" value={this.state.adslAdded} onChange={this.adslEvent}
                                   className="form-control rounded-pill" id="addedADSLRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                    <div className="col-2">
                        <div className="mb-3">
                            <label htmlFor="addedWIFIRevnue" className="form-label">الحصة الاضافية WIFI</label>
                            <input type="number" value={this.state.wifiAdded} onChange={this.wifiEvent}
                                   className="form-control rounded-pill" id="addedWIFIRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                    <div className="col-2">
                        <div className="mb-3">
                            <label htmlFor="addedWIFIRevenue" className="form-label">استهلاك باقة جيجا دينار</label>
                            <input type="number" value={this.gigaDianUsage()} onChange={this.wifiEvent}
                                   className="form-control rounded-pill" id="addedWIFIRevenue"
                                   placeholder=""/>
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <ReportTable profiles={this.state.profiles}/>

                </div>

            </div>
            <EditDialog onSave={this.saveEdits} show={this.state.showDialog} profiles={this.state.profiles}/>
        </div>);
    }
}


let item = document.getElementById("reportTable");
console.log(item);
const e = React.createElement;
ReactDOM.render(e(ReportView), item);
