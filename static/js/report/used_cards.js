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
            <th className="col-3" scope="row"> {this.props.order} </th>
            <td className="col-3"> {card.pin}</td>
            <td className="col-3"> {card.used_at}</td>
            <td className="col-3"> {card.user_id !== null ? card.username : ""}</td>
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
            cards: this.cards,
            value: props.value,
            prefix: props.prefix,
            from: props.from,
            to: props.to,
            search: props.search,
            selected: props.selected,

        };
        console.log(props);
    }

    componentWillReceiveProps(newProps) {
        this.cards = [];
        this.page = 1;
        this.setState({
            cards: [],
            value: newProps.value,
            from: newProps.from,
            to: newProps.to,
            search: newProps.search,
            prefix: newProps.prefix,
            selected: newProps.selected,
        });
        this.load(newProps)
    }

    componentDidMount() {
        this.load(this.props)
    }

    load = (props) => {
        // if (!this.loading)
        let s = props.value;

        if (typeof s !== typeof undefined && s !== null) {
            this.setState({
                loading: true
            });
            load_series_cards(props.from, props.to, props.prefix, props.search, props.value, this.page, (data) => {

                this.cards.push(...data.results);
                this.last_page = Number(data.last_page);

                this.setState({
                    cards: this.cards,
                    loading: false,
                    last_page: this.last_page,
                });
                this.page += 1;
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

        this.setState({
            cards: this.cards
        });

        console.log(this.state)
    };


    count = (search) => {
        return this.cards.filter((item, i) => {
            console.log(item);
            if (item.user_id != null) {
                return item.username.includes(search);
            }
            return false
        }).length
    };


    render() {
        // console.log("Cards", this.state.cards);
        let progress = () => {
            if (this.state.loading)
                return (
                    <div className="progress">
                        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                             style={{width: 100 + '%'}} aria-valuenow="100"
                             aria-valuemin="0" aria-valuemax="100">Loading
                        </div>
                    </div>
                )
        };


        return (
            <div>
                <div>
                    <div className="row">
                        {/*<div className="col">*/}
                        {/*WIFI: {this.count("HTI")}*/}
                        {/*</div>*/}
                        {/*<div className="col">*/}
                        {/*ADSL: {this.count("ROL")}*/}
                        {/*</div>*/}
                        <div className="col-auto">
                            Total used: {this.state.selected.count}
                        </div>
                        <div className="col-auto">
                            Total: {this.state.selected.total}
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

                            <tr>

                                <td colSpan={4} className={"border-0"}>
                                    {progress()}
                                    {this.state.cards.length < this.state.selected.count && !this.state.loading ?
                                        <div className="col-12 text-center">
                                            <button className="btn btn-link rounded-pill" onClick={(e) => {
                                                this.load(this.props)
                                            }}>
                                                Load more
                                            </button>
                                        </div> : ""}
                                </td>
                            </tr>

                            </tbody>
                        </table>
                    </div>


                </div>
            </div>
        );
    }
}

class CardsView extends React.Component {
    search = "";

    constructor(props) {
        super(props);
        this.state = {
            search: "",
            searchKey: "",
            from: props.from,
            to: props.to,
            prefix: props.prefix,
            value: props.value,
            selected: props.selected,
        };
    }

    componentDidMount() {
        let table = this;


        // load_series_cards(
        //   this.state.from,
        //   this.state.to,
        //   this.state.prefix,
        //   "",
        //   (data) => {
        //     let cards = data.results;
        //     // console.log(cards);
        //     table.setState({
        //         cards: cards,
        //     });
        //   }
        // );
    }

    searchEventClick = (e) => {
        this.setState({
            search: this.state.search,
        });
        this.setState({
            search: this.state.search,
        });
    };
    searchEvent = (e) => {
        let search = e.target.value;
        this.setState({
            search: search,
        });
        this.setState({
            search: search,
        });
        // this.search = search;
    };

    render() {
        return (
            <div className="over-layer show">
                <div class="over-layer show" onClick={(e) => {
                    this.props.dismiss()
                }}/>
                <div className="content bg-white">
                    <div className="row mb-2">
                        <div className="col"/>
                        <div className="col-auto">
                            <button className="btn" onClick={(e) => {
                                this.props.dismiss()
                            }}>X
                            </button>
                        </div>
                    </div>
                    <div className="col-12">
                        <h3 className="text-center">Card lists type: {this.state.value}</h3>
                        <div className="row">
                            <div className="row mb-2">
                                <div className="col-auto">
                                    <p className="p-0 m-0">-</p>
                                    <a href={`/reports/cards/export?from=${this.state.from}&to=${this.state.to}&prefix=${this.state.prefix}&value=${this.state.value}&search=${this.state.search}`} className="btn btn-outline-info rounded-pill">
                                        Export
                                    </a>
                                    <button onClick={this.searchEventClick}
                                            className="btn btn-outline-info rounded-pill">
                                        Search
                                    </button>
                                </div>

                                <div className="col">
                                    <div className="mb-3">
                                        <label htmlFor="coffeCardsRevnue" className="form-label">
                                            بحث:
                                        </label>
                                        <input
                                            type="text"
                                            value={this.state.search}
                                            onChange={this.searchEvent}
                                            className="form-control rounded-pill"
                                            placeholder=""
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <CardsTable
                            prefix={this.state.prefix}
                            search={this.state.search}
                            used_only={this.state.used_only}
                            from={this.state.from}
                            to={this.state.to}
                            value={this.state.value}
                            selected={this.state.selected}
                        />
                    </div>
                </div>
            </div>
        );
    }
}


class SummaryRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            summary: this.props.summary,
            order: this.props.order,
        }

    }

    render() {
        let summary = this.state.summary;
        return (<tr>
            <th className="col-1" scope="row"> {this.state.order} </th>
            <td className="col-3"> {summary.value}</td>
            <td className="col-3"> {summary.count}</td>
            <td className="col-3"> {summary.total}</td>
            <td className="col-2">
                <button className="btn btn-light" onClick={this.props.onClick}>Show</button>
            </td>
        </tr>);
    }
}


class CardsSummaryTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            cards_summary: this.props.cards_summary,
            loading: this.props.loading,
            prefix: this.props.prefix,
            from: this.props.from,
            to: this.props.to,
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            cards_summary: newProps.cards_summary,
            loading: newProps.loading,
            prefix: this.props.prefix,
            from: this.props.from,
            to: this.props.to,
        });
    }

    select = (s) => {
        this.props.select(s)
    };

    render() {

        return (
            <div>
                <table style={{overflow: 'scroll', width: '90vw'}} className="table table-hover text-center">
                    <thead>
                    <tr>
                        <th className="col-1" scope="col">#</th>
                        <th className="col-3" scope="col">Value</th>
                        <th className="col-3" scope="col">Used</th>
                        <th className="col-3" scope="col">Total</th>
                        <th className="col-2" scope="col">-</th>

                    </tr>
                    </thead>
                </table>
                <div style={{height: '70vh', overflow: 'scroll', width: '90vw'}}>

                    <table className="w-100 table table-hover text-center">
                        <tbody className="container-fluid w-100">
                        {this.state.cards_summary.map((item, i) => {
                            return (
                                <SummaryRow

                                    disabled={this.state.disabled}
                                    onDelete={this.refresh}
                                    key={"report_series_" + item.value }
                                    order={i + 1}
                                    summary={item}
                                    onClick={(e) => {
                                        this.select(item)
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
        {value: "", label: "All"},
        {value: "HTIW", label: "Misurata"},
        {value: "HTIS", label: "Sirt"},
        {value: "HTIA", label: "Abugrin"},
    ];

    constructor(props) {
        super(props);
        this.state = {
            cards_summary: [],
            from: "",
            to: "",
            prefix: "",
            selected: null,
            loading: true
        };
    }

    componentDidMount() {
        let table = this;
        // let loadingScreen = $("#waitingScreen");
        // showTable();
        load_used_cards_summary(
            this.state.from,
            this.state.to,
            this.state.prefix,
            (data) => {
                let cards_summary = data.data;
                table.setState({
                    cards_summary: cards_summary,
                    selected: null,
                    loading: false
                });
            }
        );
    }

    loadUsers=(e)=> {
        let table = this;
        console.log("Did updated");
        table.setState({
                    cards_summary: [],
                    selected: null,
                    loading: true
                });
         load_used_cards_summary(
            this.state.from,
            this.state.to,
            this.state.prefix,
            (data) => {
                let cards_summary = data.data;
                table.setState({
                    cards_summary: cards_summary,
                    selected: null,
                    loading: false
                });
            }
        );
    };

    selectSeries = (series) => {
        console.log("Series selected", series);
        this.setState({
            selected: series,
        });
        this.setState({
            selected: series,
        });
    };
    selectCity = (e) => {
        let city = e.target.value;
        this.setState({
            prefix: city,
        });
    };
    startDateEvent = (e) => {
        let v = e.target.value;
        console.log("Start date", v);
        this.setState({
            from: v,
        });
        this.setState({
            from: v,
        });
    };
    endDateEvent = (e) => {
        let v = e.target.value;
        this.setState({
            to: v,
        });
        this.setState({
            to: v,
        });
    };
    selectEvent = (e) => {
        let v = e.target.value;
        this.setState({
            search: v,
        });
        this.setState({
            search: v,
        });
    };



    render() {
        console.log(this.state);
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <h3 className="text-center">Used Card</h3>
                        <div className="col-12 row">
                            <div className="col-2">
                                <label className="form-label"> المدينة:</label>
                                <select
                                    onChange={this.selectCity}
                                    id="citySelecta"
                                    options={this.options}
                                    className="form-select rounded-pill"
                                >
                                    {this.options.map((item, i) => {
                                        return (
                                            <option
                                                {...(i == 0 ? "selected" : "")}
                                                value={item.value}
                                            >
                                                {item.label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="col-2">
                                <div className="mb-3">
                                    <label htmlFor="coffeeBandwidth" className="form-label">
                                        {" "}
                                        من:
                                    </label>
                                    <input
                                        type="date"
                                        value={this.state.from}
                                        onChange={this.startDateEvent}
                                        className="form-control rounded-pill"
                                        id="coffeeBandwidth"
                                        placeholder=""
                                    />
                                </div>
                            </div>
                            <div className="col-2">
                                <div className="mb-3">
                                    <label htmlFor="gigaDinarRevnue" className="form-label">
                                        الي:
                                    </label>
                                    <input
                                        type="date"
                                        value={this.state.to}
                                        onChange={this.endDateEvent}
                                        className="form-control rounded-pill"
                                        id="gigaDinarRevnue"
                                        placeholder=""
                                    />
                                </div>
                            </div>
                            <div className="col-2">
                                <p className="p-0 m-0">-</p>
                                <button className="btn btn-light" onClick={this.loadUsers}>Search</button>
                            </div>
                        </div>
                        <CardsSummaryTable
                            loading={this.state.loading}
                            prefix={this.state.prefix}
                            from={this.state.from}
                            to={this.state.to}
                            cards_summary={this.state.cards_summary}
                            select={this.selectSeries}
                        />
                    </div>

                </div>
                {this.state.selected != null ? <CardsView
                    dismiss={() => {
                        this.setState({selected: null})
                    }}
                    value={this.state.selected.value} selected={this.state.selected}
                    prefix={this.state.prefix}
                    from={this.state.from}
                            to={this.state.to}
                /> : ""}
                {/*<EditDialog onSave={this.saveEdits} show={this.state.showDialog} profiles={this.state.profiles}/>*/}
            </div>
        );
    }
}


let item = document.getElementById("reportTable");
console.log(item);
const e = React.createElement;
ReactDOM.render(e(ReportView), item);