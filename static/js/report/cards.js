let series = [];


class CardRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            card: this.props.card,
            // order: this.props.order,
        }

    }


    removeItem = (e) => {

        this.props.onDelete();
    };

    render() {
        let card = this.state.card;
        return (<tr onClick={this.props.onClick} className="col-12">
            <th className="col-3" scope="row"> {card.id} </th>
            <td className="col-3"> {card.pin}</td>
            <td className="col-3"> {card.used_at}</td>
            <td className="col-3"> {card.user_id !== null ? card.user_details.username : ""}</td>
        </tr>);
    }
}

class CardsTable extends React.Component {
    page = 1;
    last_page = 0;
    loading = false;
    cards = [];

    constructor(props) {
        super(props);
        this.state = {
            series: props.series,
            cards: this.cards,
            startDate: props.startDate,
            endDate: props.endDate,
            search: props.search,
            city: props.city,
        };
    }

    componentWillReceiveProps(newProps) {


        this.setState({

            cards: [],
            startDate: newProps.startDate,
            endDate: newProps.endDate,
            search: newProps.search,
            city: newProps.city,
        });
        if (newProps.series !== this.state.series) {
            this.page = 1;
            this.cards = [];
            this.setState({
                series: newProps.series,
            });
            this.load(newProps.series)
        }
        console.log(newProps.endDate, newProps.startDate,);
        this.filter(newProps);
    }

    componentDidMount() {
        this.load(this.props.series)
    }

    load = (s) => {

        if (typeof s !== typeof undefined && s !== null) {
            load_series_cards(s, this.page, 100, (data) => {
                console.log(data);
                this.cards.push(...data.data);
                this.last_page = Number(data.last_page);

                this.setState({
                    cards: this.cards,
                    loading: this.loading,
                    last_page: this.last_page,
                });
                this.page += 1;
                if (this.page <= this.last_page) {
                    this.load(s)
                } else {
                    this.page = this.last_page;
                }
                this.filter(this.props);
            });
        }
    };

    filter = (props) => {
        let start = props.startDate;
        let end = props.endDate;
        let city = props.city;
        let search = props.search;
        let used_only = props.used_only;

        let cards = this.cards.filter((item, i) => {
            let date = new Date(item.used_at);
            let validDate = true;//date > start && date < end;
            let validCity = false;
            let validSearch = true;
            let validUsed = true;

            if (typeof start !== typeof undefined && start != null)
                validDate = date > new Date(start);
            if (typeof end !== typeof undefined && end != null)
                validDate = date < new Date(end);
            if (typeof end !== typeof undefined && typeof start !== typeof undefined && start != null && end != null)
                validDate = date > new Date(start) && date < new Date(end);

            if (item.user_id != null) {
                let user = item.user_details.username;
                if (city === "" || city === "Mis") {
                    validCity = !user.startsWith("HTIA") && !user.startsWith("HTIS");
                } else {
                    if (city === "SIRT") {
                        validCity = user.startsWith("HTIS");
                    } else if (city === "AbuGrain") {
                        validCity = user.startsWith("HTIA");
                    }
                }
                if (search != null && typeof search !== typeof undefined)
                    validSearch = user.includes(search)
            } else {
                validCity = true;
                if (used_only)
                    validUsed = false;
            }

            return validDate && validCity && validSearch && validUsed;
        });


        this.setState({
            cards: cards
        })
    };


    count = (search) => {
        return this.state.cards.filter((item, i) => {
            if (item.user_id != null) {
                return item.user_details.username.includes(search);
            }
            return false
        }).length
    };



    render() {
        // console.log("Cards", this.state.cards);
        let progress = () => {
            if (this.page !== this.last_page)
                return (
                    <div className="progress">
                        <div className="progress-bar progress-bar-striped" role="progressbar"
                             style={{width: (this.page / this.last_page * 100) + '%'}} aria-valuenow="100"
                             aria-valuemin="0" aria-valuemax="100">{this.page}/{this.last_page} </div>
                    </div>
                )
        };
        let wifi = 0;
        let adsl = 0;
        let used = 0;
        for (let c of this.state.cards) {
            if (c.user_id != null) {
                let username = c.user_details.username;
                used += 1;
                if (username.startsWith("HTI")) {
                    wifi += 1;
                } else if (username.startsWith("ROL")) {
                    adsl += 1;
                }

            }
        }

        return (
            <div>
                <div className="row">
                    <div className="col">
                        WIFI: {this.count("HTI")}
                    </div>
                    <div className="col">
                        ADSL: {this.count("ROL")}
                    </div>
                    <div className="col">
                        Total used: {this.count("")}
                    </div>
                    <div className="col">
                        Total: {this.state.cards.length}
                    </div>
                </div>
                <table className="table table-hover">
                    <thead>
                    <tr>
                        <th className="col-3" scope="col">#</th>
                        <th className="col-3" scope="col">PIN</th>
                        <th className="col-3" scope="col">Used at</th>
                        <th className="col-3" scope="col">Used by</th>
                    </tr>
                    </thead>
                </table>

                {progress()}
                <div style={{height: '50vh', overflow: 'scroll', width: '100%'}}>

                    <table className="w-100 table table-hover">
                        <tbody className="container-fluid w-100">
                        {this.state.cards.map((card, i) => {
                            return (
                                <CardRow
                                    disabled={this.state.disabled}
                                    onDelete={this.refresh}
                                    key={"report_series_card_" + card.id}
                                    order={i + 1}
                                    card={card}
                                    onClick={(e) => {
                                        // this.select(series.series)
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


class ReportRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            series: this.props.series,
            order: this.props.order,
        }

    }


    removeItem = (e) => {

        this.props.onDelete();
    };

    render() {
        let series = this.state.series;
        return (<tr onClick={this.props.onClick}>
            <th scope="row"> {this.state.order} </th>
            <td> {series.series}</td>
            <td> {series.value}</td>
            <td> {series.qty}</td>
            <td> {series.used}</td>
        </tr>);
    }
}


class ReportTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            series: this.props.series,
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            series: newProps.series,
        });
    }

    select = (s) => {
        this.props.select(s)
    };

    render() {

        return (
            <div>
                <table className="table table-hover">
                    <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Series</th>
                        <th scope="col">Value</th>
                        <th scope="col">Quantity</th>
                        <th scope="col">Used</th>

                    </tr>
                    </thead>
                </table>
                <div style={{height: '70vh', overflow: 'scroll', width: '100%'}}>

                    <table className="w-100 table table-hover">
                        <tbody className="container-fluid w-100">
                        {this.state.series.map((series, i) => {
                            return (
                                <ReportRow
                                    disabled={this.state.disabled}
                                    onDelete={this.refresh}
                                    key={"report_series_" + series.series + "_" + i}
                                    order={i}
                                    series={series}
                                    onClick={(e) => {
                                        this.select(series.series)
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
            series: [],
            used_only: false,
            city: "",
            selected: null,
            startDate: null,
            endDate: null,
        }
    }

    componentDidMount() {
        let table = this;
        let loadingScreen = $("#waitingScreen");
        // showTable();
        load_serieses((data) => {
            let series = data.data;
            this.setState({
                series: series,
                selected: null,
            })
        });

    }

    selectSeries = (series) => {
        console.log("Series selected", series);
        this.setState({
            selected: series
        });
        this.setState({
            selected: series
        })
    };
    selectCity = (e) => {
        let city = e.target.value;
        this.setState({
            city: city,
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


    render() {
        return (<div className="container-fluid">
            <div className="row">

                <div className={this.state.selected == null ? "col-12" : "col-4 bg-light"}>
                    <h3 className="text-center">Card groups</h3>
                    <ReportTable series={this.state.series} select={this.selectSeries}/>
                </div>
                <div className={this.state.selected == null ? "d-none" : "col-8"}>
                    <h3 className="text-center">Card lists</h3>
                    <div className="row">


                        <div className="row mb-2">
                            <div className="col-auto">
                                <p>-</p>
                                <button className="btn btn-outline-info rounded-pill">Export</button>
                            </div>


                            <div className="col-2">
                                <label className="form-label"> المدينة:</label>
                                <select onChange={this.selectCity} id="citySelecta" options={this.options}
                                        className="form-select rounded-pill">
                                    {this.options.map((item, i) => {
                                        return <option {...(i == 0) ? "selected" : ""}
                                                       value={item.value}>{item.label}</option>;
                                    })}

                                </select>
                            </div>
                            <div className="col-2">
                                <div className="mb-3">
                                    <label htmlFor="coffeeBandwidth" className="form-label"> من:</label>
                                    <input type="date" value={this.state.startDate} onChange={this.startDateEvent}
                                           className="form-control rounded-pill" id="coffeeBandwidth"
                                           placeholder=""/>
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mb-3">
                                    <label htmlFor="gigaDinarRevnue" className="form-label">الي:</label>
                                    <input type="date" value={this.state.endDate} onChange={this.endDateEvent}
                                           className="form-control rounded-pill" id="gigaDinarRevnue"
                                           placeholder=""/>
                                </div>
                            </div>
                            <div className="col">
                                <div className="mb-3">
                                    <label htmlFor="coffeCardsRevnue" className="form-label">بحث:</label>
                                    <input type="text"
                                           value={this.state.search}
                                           onChange={this.searchEvent}
                                           className="form-control rounded-pill"
                                           placeholder=""/>
                                </div>
                            </div>
                            <div className="col-auto">
                                <div className="mb-3">
                                    <label htmlFor="coffeCardsRevnue" className="form-label"> المستخدمة فقط:</label>
                                    <input type="checkbox" defaultChecked={this.state.used_only} onChange={this.usedOnlyEvent}/>
                                </div>
                            </div>


                        </div>
                    </div>
                    <CardsTable city={this.state.city}
                                search={this.state.search}
                                used_only={this.state.used_only}
                                startDate={this.state.startDate} endDate={this.state.endDate}
                                cards={[]}
                                series={this.state.selected}/>
                </div>
            </div>
            {/*<EditDialog onSave={this.saveEdits} show={this.state.showDialog} profiles={this.state.profiles}/>*/}
        </div>);
    }
}


let item = document.getElementById("reportTable");
console.log(item);
const e = React.createElement;
ReactDOM.render(e(ReportView), item);