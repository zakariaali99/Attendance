let reportsStatic = [];
let cityFilter = (k, city) =>{
    if (city == "SIRT") {
        return k.startsWith("SIRT")
    } else if (city == "AbuGrain") {
        return k.startsWith(city)
    } else {
        return !k.startsWith("SIRT") & !k.startsWith("AbuGrain")
    }
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

    if (prefix(a.profile) === prefix(b.profile))
        return 0;

    if (prefix(a.profile) > prefix(b.profile))
        return 1;
    else
        return -1;
}
class ProfileDetailRow extends React.Component {
    constructor(props) {
        super(props);

    }

    removeItem = (e) => {
        // billItems.pop(this.props.num);
        this.props.onDelete();
    };

    render() {
        
        let profile = this.props.profile;
        let total = profile.rol_active + profile.hti_active;
        let totalCIR = profile.cir * total;
        if (profile.profile.includes("5G-5L")) {
            totalCIR = users_traffic.map((item, i) => item[1].total_real.reduce((p, c) => p + c, 0), 0).reduce((p, c) => p + c, 0);
            console.log("total cir of 5g5lyd", totalCIR)

        }
        return (
            <tr>
                <th style={{ width: "200px" }} scope="row"> {profile.profile} </th>
                <td style={{"min-width": "5vw"}}> {profile.price}</td>
                <td style={{"min-width": "5vw"}}> {profile.hti}</td>
                <td style={{"min-width": "5vw"}}> {profile.totalHTIPrev}</td>
                <td style={{"min-width": "5vw"}}> {profile.rol}</td>
                <td style={{"min-width": "5vw"}}> {profile.totalHTIPrev}</td>
                <td style={{"min-width": "5vw"}}> {profile.hti_active}</td>
                <td style={{"min-width": "5vw"}}> {profile.rol_active}</td>

                <td style={{"min-width": "5vw"}}> {profile.cir}</td>
                <td style={{"min-width": "5vw"}}> {round(totalCIR / 1024)}</td>

                <td style={{"min-width": "5vw"}}> {profile.avr}</td>
                <td style={{"min-width": "5vw"}}> {round(profile.avr * total / 1024)}</td>
                <td style={{"min-width": "5vw"}}> {total * profile.price}</td>

            </tr>
        );
    }
}
class ProfilesTable extends React.Component {
    options = [
        {value: 'Mis', label: 'Misurata'},
        {value: 'SIRT', label: 'Sirt'},
        {value: 'AbuGrain', label: 'Abugrin'}
    ];

    constructor(props) {
        super(props);
        this.state = {
            report: this.props.report,
        };
        // console.log("From table", this.props.profiles, this.state.profiles)
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            report: newProps.report,
            showDialog: false
        });
        // console.log("From table", this.props.profiles, this.state.profiles)
    }

    selectCity = (e) => {
        let city = e.target.value;
        
        this.setState({
            city: city,
        })
        this.props.changeCity(city);
    };

    coffeeBandwidthEvent = (e) => {
        console.log("Coffe band")
        let band = Number(e.target.value);
        this.state.report.coffee_band = band
        this.setState({
            report: this.state.report
        });
        // this.props.changeCity(city);
    };
    

    coffeeEvent = (e) => {
        let band = Number(e.target.value);
        this.state.report.coffee = band;
        this.setState({
            report: this.state.report
        });
        // this.props.changeCity(city);
    };

    adslEvent = (e) => {
        let v = Number(e.target.value);
        this.state.report.added_adsl = v
        this.setState({
            report: this.state.report
        });
        // this.props.changeCity(city);
    };

    wifiEvent = (e) => {
        let v = Number(e.target.value);
        this.state.report.added_wifi = v
        this.setState({
            report: this.state.report
        });
        // this.props.changeCity(city);
    };

    showEditDialog = (e) => {
        this.setState({
            showDialog: true
        })
    };

    gigaDinarTrafficValue = () => {
        let city = this.state.city;

        try{
            if (city == "SIRT") {
                return this.state.report.giga.find((item)=>item.profile_details=="SIRT_5G-5LYD").total
            } else if (city == "AbuGrain") {
                return this.state.report.giga.find((item)=>item.profile_details=="AbuGrain-5G-5LYD").total
            } else {
                console.log(this.state.report.giga.find((item)=>item.profile_details=="5G-5LYD").total)
                return this.state.report.giga.find((item)=>item.profile_details=="5G-5LYD").total
            }
        }catch(e){}
    return 0
    };

    export = (e) => {
        let report = this.state.report;
        // function exportExcel() {
            let city = this.state.city;
            let a = [];
            a.push(["WIFI", "", "", "", "", "", "", "", "", "", "",
            " ", " ",
            "ADSL", "", "", "", "", "", "", "", "", "", "",
        ]);
            a.push(["#", "Price", "Users", "Prev total", "Diff", "Active", "CIR", "CIR*Total", "AVR", "AVR*total", "Revnues",
                " ", " ",
                "#", "Price", "Users", "Prev total", "Diff", "Active", "CIR", "CIR*Total", "AVR", "AVR*total", "Revnues",
            ]);
            let totalHTI = 0;
            let totalROL = 0;

            let totalHTIOn = 0;
            let totalROLOn = 0;

            let totalHTIPrev = 0;
            let totalROLPrev = 0;

            let htiCIR = 0;
            let rolCIR = 0;

            let htiAVR = 0;
            let rolAVR = 0;

            let totalHTICIR = 0;
            let totalROLCIR = 0;

            let totalHTIAVR = 0;
            let totalROLAVR = 0;

            let totalRevenueHTI = 0;
            let totalRevenueROL = 0;

            let addedRevenueHTI = this.state.report.added_wifi;
            let addedRevenueROL = this.state.report.added_adsl;

            let gigaForDinarRevenue = this.gigaDinarTrafficValue();

            let coffeRevenue = this.state.report.coffee;
            

            this.state.report.profile.sort(sort_profiles).forEach(v => {
                let add = false;
                if (city == "SIRT") {
                    add = v.profile.startsWith("SIRT")
                } else if (city == "AbuGrain") {
                    add = v.profile.startsWith(city)
                } else {
                    add = !v.profile.startsWith("SIRT") & !v.profile.startsWith("AbuGrain");
                }
                if (add) {
                    let revenu_wifi = v.hti_active * v.price;
                    let revenu_adsl = v.rol_active * v.price;
                    if(v.profile.includes("5G-5LY")){
                    let revenu_wifi = 0;
                    let revenu_adsl = 0;
                    }
                
                    a.push([v.profile, v.price, v.hti, v.totalHTIPrev, v.hti_active - v.totalHTIPrev, v.hti_active, v.cir, v.cir * v.hti_active, v.avr, v.avr * v.hti_active, v.hti_active * v.price,
                        " ", " ",
                        v.profile, v.price, v.rol, v.totalROLPrev, v.rol_active - v.totalROLPrev, v.rol_active, v.cir, v.cir * v.rol_active, v.avr, v.avr * v.rol_active, v.rol_active * v.price,
                    ]);
                    totalHTI += v.hti;
                    totalROL += v.rol;

                    totalHTIOn += v.hti_active;
                    totalROLOn += v.rol_active;

                    totalHTIPrev += v.totalHTIPrev;
                    totalROLPrev += v.totalROLPrev;

                    htiCIR += v.cir;
                    rolCIR += v.cir;

                    totalHTICIR += v.cir * v.hti_active;
                    totalROLCIR += v.cir * v.rol_active;


                    htiAVR += v.avr;
                    rolAVR += v.avr;

                    totalHTIAVR += v.avr * v.hti_active;
                    totalROLAVR += v.avr * v.rol_active;

                    totalRevenueHTI += revenu_wifi;
                    totalRevenueROL += revenu_adsl;
                }

            });

            a.push([""])
            a.push([
                "Total", "", totalHTI, totalHTIPrev, totalHTIOn - totalHTIPrev, totalHTIOn, htiCIR, totalHTICIR, htiAVR, totalHTIAVR, totalRevenueHTI,
                "", "",
                "Total", "", totalROL, totalROLPrev, totalROLOn - totalROLPrev, totalROLOn, rolCIR, totalROLCIR, rolAVR, totalROLAVR, totalRevenueROL,
                
            ]);
            a.push([
                "Total active users", totalROLOn + totalHTIOn,
            ]);
            a.push([""]);
            a.push([""]);

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
            sheet["A1"] = cell("WIFI", style("FF8F99C5"));
            sheet["N1"] = cell("ADSL", style("FF98E2C6"));

            sheet["A" + (lastIndex + 1)] = cell("Users", style("ff134F5C"));
            sheet["A" + (lastIndex + 2)] = cell("Total active users", style("ff134F5C"));
            sheet["B" + (lastIndex + 2)] = cell(totalROLOn + totalHTIOn, style("ff134F5C"));

            sheet["A" + (lastIndex + 3)] = cell("Total active Prev", style("ff134F5C"));
            sheet["B" + (lastIndex + 3)] = cell(totalROLPrev + totalHTIPrev, style("ff134F5C"));
            
            sheet["A" + (lastIndex + 4)] = cell("Diff", style("ff134F5C"));
            sheet["B" + (lastIndex + 4)] = cell((totalROLOn + totalHTIOn)-(totalROLPrev + totalHTIPrev), style("ff134F5C"));

            sheet["F" + (lastIndex + 1)] = cell("Revenue", style("ffB6D7A8"));
            sheet["F" + (lastIndex + 2)] = cell("ADSL Revenue", style("ffB6D7A8"));
            sheet["H" + (lastIndex + 2)] = cell(totalRevenueROL, style("ffB6D7A8"));
            sheet["I" + (lastIndex + 2)] = cell("Additinal qouta Revenues", style("ffB6D7A8"));
            sheet["K" + (lastIndex + 2)] = cell(addedRevenueROL, style("ffB6D7A8"));

            sheet["F" + (lastIndex + 3)] = cell("WIFI Revenue", style("ffB6D7A8"));
            sheet["H" + (lastIndex + 3)] = cell(totalRevenueHTI, style("ffB6D7A8"));
            sheet["I" + (lastIndex + 3)] = cell("Additinal qouta Revenues", style("ffB6D7A8"));
            sheet["K" + (lastIndex + 3)] = cell(addedRevenueHTI, style("ffB6D7A8"));


            sheet["F" + (lastIndex + 4)] = cell("Giga for dinar Revenue", style("ffB6D7A8"));
            sheet["H" + (lastIndex + 4)] = cell(gigaForDinarRevenue, style("ffB6D7A8"));

            sheet["F" + (lastIndex + 5)] = cell("Coffee Revenues", style("ffB6D7A8"));
            sheet["H" + (lastIndex + 5)] = cell(round(coffeRevenue), style("ffB6D7A8"));

            sheet["F" + (lastIndex + 5)] = cell("Total Revenue", style("ffB6D7A8"));
            let total = totalRevenueROL + totalRevenueHTI + addedRevenueHTI + addedRevenueROL + coffeRevenue + gigaForDinarRevenue;
            sheet["H" + (lastIndex + 5)] = cell(round(total), style("ffB6D7A8"));

            
            sheet["N" + (lastIndex + 1)] = cell("CIR Bandwidth (mpbs)", style("ffFABB88"));
            sheet["N" + (lastIndex + 2)] = cell("ADSL Bandwidth", style("ffFABB88"));
            sheet["P" + (lastIndex + 2)] = cell(round(totalROLCIR / 1024,2), style("ffFABB88"));
            
            sheet["N" + (lastIndex + 3)] = cell("WIFI Bandwidth", style("ffFABB88"));
            sheet["P" + (lastIndex + 3)] = cell(round(totalHTICIR / 1024,2), style("ffFABB88"));

            let g = Number(round( (gigaForDinarRevenue*8*1024)/(30*8*60*60), 2));
            let coffeeBand = this.state.report.coffee_band;
            
            sheet["N" + (lastIndex + 4)] = cell("Giga Dianr Bandwidth", style("ffFABB88"));
            sheet["P" + (lastIndex + 4)] = cell(round(g), style("ffFABB88"));
            
            sheet["N" + (lastIndex + 5)] = cell("Coffees Bandwidth", style("ffFABB88"));
            sheet["P" + (lastIndex + 5)] = cell(round(coffeeBand), style("ffFABB88"));
            
            sheet["N" + (lastIndex + 6)] = cell("Total Bandwidth", style("ffFABB88"));
            sheet["P" + (lastIndex + 6)] = cell(round((totalHTICIR+totalROLCIR)/1024 +g+coffeeBand), style("ffFABB88"));

            // ========================= AVR total

            sheet["R" + (lastIndex + 1)] = cell("AVR Bandwidth (mpbs)", style("ffFABB88"));
            sheet["R" + (lastIndex + 2)] = cell("ADSL Bandwidth", style("ffFABB88"));
            sheet["T" + (lastIndex + 2)] = cell(round(totalROLAVR / 1024,2), style("ffFABB88"));

            sheet["R" + (lastIndex + 3)] = cell("WIFI Bandwidth", style("ffFABB88"));
            sheet["T" + (lastIndex + 3)] = cell(round(totalHTIAVR / 1024,2), style("ffFABB88"));

            

            sheet["R" + (lastIndex + 4)] = cell("Giga Dianr Bandwidth", style("ffFABB88"));
            sheet["T" + (lastIndex + 4)] = cell(g, style("ffFABB88"));

            sheet["R" + (lastIndex + 5)] = cell("Coffees Bandwidth", style("ffFABB88"));
            sheet["T" + (lastIndex + 5)] = cell(round(coffeeBand), style("ffFABB88"));

            sheet["R" + (lastIndex + 6)] = cell("Total AVR Bandwidth", style("ffFABB88"));
            sheet["T" + (lastIndex + 6)] = cell(round((totalHTIAVR+totalROLAVR)/1024 +g+coffeeBand), style("ffFABB88"));


            let mergedStart=5;
            let mergedEnd=6;
            sheet['!merges'] = [
                { s: { c: 0, r: 0 }, e: { c: 10, r: 0}},
                { s: { c: 13, r: 0 }, e: { c: 23, r: 0 }},
                


                { s: { c: mergedStart, r: lastIndex }, e: { c: mergedEnd, r: lastIndex }},
                { s: { c: mergedStart, r: lastIndex+1 }, e: { c: mergedEnd, r: lastIndex+1 }},
                { s: { c: mergedStart, r: lastIndex+2 }, e: { c: mergedEnd, r: lastIndex+2 }},
                { s: { c: mergedStart, r: lastIndex+3 }, e: { c: mergedEnd, r: lastIndex+3 }},
                { s: { c: mergedStart, r: lastIndex+4 }, e: { c: mergedEnd, r: lastIndex+4 }},
                { s: { c: mergedStart, r: lastIndex+5 }, e: { c: mergedEnd, r: lastIndex+5 }},

                { s: { c: mergedStart+3, r: lastIndex+1 }, e: { c: mergedEnd+3, r: lastIndex+1 }},
                { s: { c: mergedStart+3, r: lastIndex+2 }, e: { c: mergedEnd+3, r: lastIndex+2 }},
                { s: { c: mergedStart+3, r: lastIndex+3 }, e: { c: mergedEnd+3, r: lastIndex+3 }},


                { s: { c: mergedStart+8, r: lastIndex }, e: { c: mergedEnd+8, r: lastIndex }},
                { s: { c: mergedStart+8, r: lastIndex+1 }, e: { c: mergedEnd+8, r: lastIndex+1 }},
                { s: { c: mergedStart+8, r: lastIndex+2 }, e: { c: mergedEnd+8, r: lastIndex+2 }},
                { s: { c: mergedStart+8, r: lastIndex+3 }, e: { c: mergedEnd+8, r: lastIndex+3 }},
                { s: { c: mergedStart+8, r: lastIndex+4 }, e: { c: mergedEnd+8, r: lastIndex+4 }},
                { s: { c: mergedStart+8, r: lastIndex+5 }, e: { c: mergedEnd+8, r: lastIndex+5 }},
                { s: { c: mergedStart+8, r: lastIndex+6 }, e: { c: mergedEnd+8, r: lastIndex+6 }},


                { s: { c: mergedStart+12, r: lastIndex }, e: { c: mergedEnd+12, r: lastIndex }},
                { s: { c: mergedStart+12, r: lastIndex+1 }, e: { c: mergedEnd+12, r: lastIndex+1 }},
                { s: { c: mergedStart+12, r: lastIndex+2 }, e: { c: mergedEnd+12, r: lastIndex+2 }},
                { s: { c: mergedStart+12, r: lastIndex+3 }, e: { c: mergedEnd+12, r: lastIndex+3 }},
                { s: { c: mergedStart+12, r: lastIndex+4 }, e: { c: mergedEnd+12, r: lastIndex+4 }},
                { s: { c: mergedStart+12, r: lastIndex+5 }, e: { c: mergedEnd+12, r: lastIndex+5 }},
                { s: { c: mergedStart+12, r: lastIndex+6 }, e: { c: mergedEnd+12, r: lastIndex+6 }},

            ]


           
            sheet['!cols'] = [
                {wch: 20}, // "characters"
                // {wpx: 50}, // "pixels"
                // {hidden: true} // hide column
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
            // return [sheet, workbook];

    
    };


    render() {
        let prfil = this.state.report.profile.filter((item)=>{
            let k = item.profile;
            let city = this.state.city;
            return cityFilter(k, city)
            
        }).sort(sort_profiles)
        if(typeof this.state.report == typeof undefined || this.state.report == null)
            return ""
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

        for (const v of prfil) {
            hti += v.hti;
            rol += v.rol;
            let total = v.hti_active + v.rol_active;
            htiOn += v.hti_active;
            rolOn += v.rol_active;
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
                <div className="row">
                <div className="col-2">
                <p htmlFor="coffeeBandwidth" className="form-label">-</p>
                    <button className="btn" onClick={this.export}>Export</button>
                    <button className="btn" onClick={(e)=>{this.props.showDialog(true)}}>Edit</button>
                </div>
                <div className="col-2">
                <label htmlFor="coffeeBandwidth" className="form-label">المدينة</label>
                    <select onChange={this.selectCity} id="citySelecta" options={this.options}
                            className="form-select rounded-pill">
                        {this.options.map((item, i) => {
                            return <option {...(i == 0) ? "selected" : ""} value={item.value}>{item.label}</option>;
                        })}

                    </select>
                </div>
                <div className="col-4">
                        <div className="mb-3">
                            <label htmlFor="coffeeBandwidth" className="form-label">النطاق المستخدك في المقاهي
                                (MP):</label>
                            <input type="number" value={this.state.report.coffee_band} onChange={this.coffeeBandwidthEvent}
                                   className="form-control rounded-pill" id="coffeeBandwidth"
                                   />
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="mb-3">
                            <label htmlFor="coffeCardsRevnue" className="form-label">إرادات كروت المقاهي</label>
                            <input type="number" value={this.state.report.coffee} onChange={this.coffeeEvent}
                                   className="form-control rounded-pill" id="coffeCardsRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                </div>
                
                <div className="row mb-2">
                    
                
                   
                    {/* <div className="col-3"></div> */}
                    <div className="col-4">
                        <div className="mb-3">
                            <label htmlFor="gigaDinarRevnue" className="form-label">ايرادات باقة الجيجا بدينار</label>
                            <input type="number" value={this.gigaDinarTrafficValue()} onChange={this.gigaDinarEvent}
                                   className="form-control rounded-pill" id="gigaDinarRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                    
                    <div className="col-4">
                        <div className="mb-3">
                            <label htmlFor="addedADSLRevnue" className="form-label">الحصة الاضافية ADSL</label>
                            <input type="number" value={this.state.report.adslAdded} onChange={this.adslEvent}
                                   className="form-control rounded-pill" id="addedADSLRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="mb-3">
                            <label htmlFor="addedWIFIRevnue" className="form-label">الحصة الاضافية WIFI</label>
                            <input type="number" value={this.state.report.wifiAdded} onChange={this.wifiEvent}
                                   className="form-control rounded-pill" id="addedWIFIRevnue"
                                   placeholder=""/>
                        </div>
                    </div>
                    
                </div>
                <table className="table table-hover table-striped text-center" style={{"width":"80vw"}}>
                    <thead>
                    <tr>
                        <th style={{ width: "200px" }} scope="col-2">#</th>
                        <th style={{"min-width": "5vw"}} scope="col">Price</th>
                        <th style={{"min-width": "5vw"}} scope="col">WIFI</th>
                        <th style={{"min-width": "5vw"}} scope="col">WIFI Prev</th>
                        <th style={{"min-width": "5vw"}} scope="col">ADSL</th>
                        <th style={{"min-width": "5vw"}} scope="col">ADSL Prev</th>
                        <th style={{"min-width": "5vw"}} scope="col">WIFI Active</th>
                        <th style={{"min-width": "5vw"}} scope="col">ADSL Active</th>
                        <th style={{"min-width": "5vw"}} scope="col">CIR</th>
                        <th style={{"min-width": "5vw"}} scope="col">CIR total</th>
                        <th style={{"min-width": "5vw"}} scope="col">AVR</th>
                        <th style={{"min-width": "5vw"}} scope="col">AVR total</th>
                        <th style={{"min-width": "5vw"}} scope="col">Revenues</th>
                    </tr>
                    </thead>
                    </table>

                
                <div style={{height: '80vh', "width":"80vw", overflow: 'scroll'}}>

                    <table className="table table-hover table-striped text-center"  style={{"width":"80vw"}}>
                        <tbody className="container-fluid w-100">
                    
                    {prfil.map((item, i) => {

                        return (
                            <ProfileDetailRow
                                disabled={this.state.disabled}
                                onDelete={this.refresh}
                                key={"report_item_" + item.profile+i}
                                profile={item}
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
            </div>
        );
    }
}

class EditDialog extends React.Component {

    constructor(props) {
        super(props);
        this.report = this.props.report;
        this.state = {
            report: this.report,
            show: this.props.show,
            city: this.props.city,
            skipHead: true,
            loading:false,
            error:null,
        }
    }

    componentWillReceiveProps(newProps) {
        this.report = newProps.report;
        // console.log("Dialog profiles", this.profiles);
        this.setState({
            report: this.report,
            show: newProps.show,
            city: newProps.city,
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
        let rows = worksheet["!ref"].split(":")[1];
        let row = Number(rows.match("[0-9]+")[0]);
        let skipHeader = $("#skipHeader").prop("checked");
        let start = 1;
        let profiles = this.report.profile;
        if (skipHeader)
            start += 1;

        for (let i = start; i <= row; i++) {
            if (!worksheet.hasOwnProperty("A" + i)) {
                continue;
            }

            let name = worksheet["A" + i].v;
            let p = profiles.find((item) => item.profile==name)
            
            if (worksheet.hasOwnProperty("B" + i)) {
                p.price = worksheet["B" + i].v
            }
            if (worksheet.hasOwnProperty("C" + i)) {
                p.cir = worksheet["C" + i].v;
            }
            if (worksheet.hasOwnProperty("D" + i)) {
                p.avr = worksheet["D" + i].v;
            }
            if (worksheet.hasOwnProperty("E" + i)) {
                p.totalHTIPrev = worksheet["E" + i].v;
            }
            if (typeof worksheet.hasOwnProperty("F" + i)) {
                p.totalROLPrev = worksheet["F" + i].v;
            }
        }
        this.state.report.profile = profiles;
        console.log(profiles)
        this.setState({
            report:this.state.report
        })
    };
    loadExcel = (e) => {
        this.setState({
            loading:false,
            error:null
        });
        let importFile = $(e.target);
        var files = importFile.prop("files");
        let file = files[0];
        console.log(file);
        this.setState({
            loading:true,
            error:null
        });
        let reader = new FileReader();
        reader.onload = (load_e) => {
            let data = load_e.target.result;
            try {
                this.load_workbook(data);
                
            } catch (er) {
                console.log(er);
                this.setState({
                    loading:false,
                    error:"Error: try again"
                })
            }

            importFile.val("");
            importFile.prop("files", null);

        };
        reader.readAsArrayBuffer(file);


    };

    changeValue = (profile, key, value) => {
        let i = this.state.report.profile.findIndex((item) => item.id == profile);
        console.log("Index of item is ",i, key, value);
        if(i < 0)
            return;
        console.log(this.report);

        this.report.profile[i][key] = Number(value);
        if (key == "hti" || key == "rol" ){
            let staticReport = reportsStatic.find((item)=> item.id == this.report.id);
            console.log("Static",staticReport);
            if (key == "hti" && Number(value) < staticReport.profile[i].hti_active){
                this.report.profile[i].hti_active =  Number(value);
            }else{
                this.report.profile[i].hti_active =  staticReport.profile[i].hti_active;
            }
            if (key == "rol" && Number(value) < staticReport.profile[i].rol_active){
                this.report.profile[i].rol_active =  Number(value);
            }else{
                this.report.profile[i].rol_active =  staticReport.profile[i].rol_active;
            }
        }
        console.log(this.report);
        this.setState({
            report: this.report
        })
    };

    saveEdits = () => {
        this.props.onSave(this.report)
    };

    render() {

        let profiles = this.report.profile.filter((item)=> cityFilter(item.profile, this.state.city))
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
                                {this.state.loading?
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-striped bg-success" role="progressbar" style={{"width": "100%"}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>:""
                                }
                                 {this.state.error != null?
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-striped bg-danger" role="progressbar" style={{"width": "100%"}} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">{this.state.error}</div>
                                    </div>:""
                                }
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
                        {profiles.map((item, i) => {
                            let key = item.id;
                            return <div className="row mb-2" key={"item_"+item.profile}>
                                <div className="col-3">{item.profile}</div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "hti", e.target.value)
                                    }} id={"totalHTI" + key} value={item.hti} type="number" className="form-control"
                                           placeholder="Price"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "rol", e.target.value)
                                    }} id={"totalROL" + key} value={item.rol} type="number" className="form-control"
                                           placeholder="Price"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "price", e.target.value)
                                    }} id={"price" + key} value={item.price} type="number" className="form-control"
                                           placeholder="Price"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "cir", e.target.value)
                                    }} min='0' id={"cir" + key} value={item.cir} type="number" className="form-control"
                                           placeholder="CIR"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "avr", e.target.value)
                                    }} id={"avr" + key} value={item.avr} type="number" className="form-control"
                                           placeholder="AVR"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "totalHTIPrev", e.target.value)
                                    }} id={"prevHTI" + key} value={item.totalHTIPrev} type="number"
                                           className="form-control" placeholder="AVR"/>
                                </div>
                                <div className="col">
                                    <input onChange={(e) => {
                                        this.changeValue(key, "totalROLPrev", e.target.value)
                                    }} id={"prevROL" + key} value={item.totalROLPrev} type="number"
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


class ReportRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            report: this.props.report,
            // order: this.props.order,
        }

    }


    removeItem = (e) => {

        this.props.onDelete();
    };

    render() {
        let report = this.state.report;
        return (<tr onClick={this.props.onClick} className="col-12">
            <th className="col-1" scope="row"> {report.id} </th>
            <td className="col" style={{"white-space": "nowrap"}} > {report.timestamp}</td>
        </tr>);
    }
}

class ReportsList extends React.Component {
    page = 1;
    last_page = 0;
    loading = false;
    reports = [];

    constructor(props) {
        super(props);
        this.state = {
            reports: props.reports,
            // cards: this.cards,
            startDate: props.startDate,
            endDate: props.endDate,
            search: props.search,
            city: props.city,
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            reports: newProps.reports,
            // cards: this.cards,
            startDate: newProps.startDate,
            endDate: newProps.endDate,
            search: newProps.search,
            city: newProps.city,
        });
    }

    componentDidMount() {}

    count = (search) => {
        return this.state.reports.filter((item, i) => {
            if (item.user_id != null) {
                return item.user_details.username.includes(search);
            }
            return false
        }).length
    };

    select = (report) => {
        this.props.select(report);
    };



    render() {
        // console.log("Cards", this.state.cards);
        let progress = () => {
            if (this.state.reports.length <= 0)
                return (
                    <div className="progress">
                        <div className="progress-bar progress-bar-striped" role="progressbar"
                             style={{width: 100 + '%'}} aria-valuenow="100"
                             aria-valuemin="0" aria-valuemax="100">Loading... </div>
                    </div>
                )
        };
      

        return (
            <div>
                
                <table className="table table-hover">
                    <thead>
                    <tr className="row">
                        <th className="col-1" scope="col">#</th>
                        <th className="col" scope="col">Date</th>
                    </tr>
                    </thead>
                </table>

                {progress()}
                <div style={{height: '80vh', overflow: 'scroll', width: '100%'}}>

                    <table className="w-100 table table-hover">
                        <tbody className="container-fluid w-100">
                        {this.state.reports.map((report, i) => {
                            return (
                                <ReportRow
                                    disabled={this.state.disabled}
                                    onDelete={this.refresh}
                                    key={"report_" + report.id}
                                    order={i + 1}
                                    report={report}
                                    onClick={(e) => {
                                        this.select(report)
                                    }}
                                />
                            );
                        })}
                        </tbody>
                    </table>
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
        super(props);
        this.state = {
            reports: [],
            used_only: false,
            city: "",
            selected: null,
            startDate: null,
            endDate: null,
        }
    }

    componentDidMount() {
        
        load_reports(1,(data) => {
            let reports = data.results;
            console.log("Loading",reports);

            reportsStatic = JSON.parse(JSON.stringify(reports));
            this.setState({
                reports: reports,
                selected: null,
            });
            this.setState({
                reports: reports,
                selected: null,
            })
        });

    }

    selectReport = (report) => {
        console.log("report selected", report);
        this.setState({
            selected: report,
            showDialog: false,
        });
        this.setState({
            selected: report,
            showDialog: false,
        })
    };
    selectCity = (city) => {
        // let city = e.target.value;
        this.setState({
            city: city,
            showDialog: false,
        })
    };
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
        this.setState({
            search: v,
        })
    };


    usedOnlyEvent = (e) => {
        let v = !this.state.used_only;
        this.setState({
            used_only: v,
        });
        this.setState({
            used_only: v,
        })
    };

    showEditDialog = (show) => {
        let v = !this.state.used_only;
        this.setState({
            showDialog: show,
        });
        this.setState({
            showDialog: show,
        })
    };
    

    saveEdits = (report) => {
        let i = this.state.reports.findIndex((r)=>r.id == report.id)
        this.state.reports[i] = report;
        console.log(report);
        // let v = !this.state.used_only;
        this.setState({
            reports: this.state.reports,
            showDialog: false,
        });
    };


    render() {
        return (<div className="container-fluid">
            <div className="row">

                <div className={this.state.selected == null ? "col-12" : "col-2 bg-light"}>
                    <h3 className="text-center">Reports</h3>
                    <ReportsList reports={this.state.reports} select={this.selectReport}/>
                </div>
                {this.state.selected == null ? "" :
                <div className={this.state.selected == null ? "d-none" : "col-10"}>
                    <h3 className="text-center">Report at: {this.state.selected.timestamp}</h3>
                    <ProfilesTable report={this.state.selected} showDialog={this.showEditDialog} changeCity={this.selectCity} />
                    <EditDialog onSave={this.saveEdits} show={this.state.showDialog} city={this.state.city}  report={this.state.selected}  city={this.state.city} />
                </div>}
            </div>
            
        </div>);
    }
}


let item = document.getElementById("reportTable");
const e = React.createElement;
ReactDOM.render(e(ReportView), item);