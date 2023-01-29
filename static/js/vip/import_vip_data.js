


class ItemRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      invoice: props.invoice,
    };
  }
  componentDidMount() {
    let url = "/api/vip/add";

    let token = $("input[name=csrfmiddlewaretoken]").val();
    $.ajax(url, {
      method: "POST",
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({
        user: this.state.invoice.username,
        bill_number: this.state.invoice.invoice,
        cost: this.state.invoice.value,
        paid_until:new Date(this.state.invoice.date).toISOString(),
        
        paid: this.state.invoice.paid.toLocaleLowerCase() == "yes",
        name:this.state.invoice.alternative_name,
        csrfmiddlewaretoken: token,
      }),
      beforeSend: function (xhr, settings) {
        xhr.setRequestHeader("X-CSRFToken", token);
      },
      success: (data) => {
          let invoice = this.state.invoice;
        //   if(data.state == "error"){
        //   }
        //   if(data.state == "success"){
              invoice.state = data.state;
        // }
        this.setState({
            invoice: invoice
        });
      },
    });
  }

  // d = {username:username, date: newDate, invoice:invoice, state:null, paid:paid,value:value};
  render() {
      let progress = <div className="progress">
      <div
        className="progress-bar progress-bar-striped bg-primary progress-bar-animated"
        role="progressbar"
        style={{ width: "100%" }}
        aria-valuenow="100"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        Processing
      </div>
    </div>;
      if(this.state.invoice.state == "error" ){
          progress = <div className="progress">
          <div
            className="progress-bar bg-danger"
            role="progressbar"
            style={{ width: "100%" }}
            aria-valuenow="100"
            aria-valuemin="0"
            aria-valuemax="100">
            Error
          </div>
        </div>
      }
      if(this.state.invoice.state == "success" ){
          progress = <div className="progress">
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: "100%" }}
            aria-valuenow="100"
            aria-valuemin="0"
            aria-valuemax="100">
            Success
          </div>
        </div>
      }

      if(this.state.invoice.state == "updated" ){
          progress = <div className="progress">
          <div
            className="progress-bar bg-warning"
            role="progressbar"
            style={{ width: "100%" }}
            aria-valuenow="100"
            aria-valuemin="0"
            aria-valuemax="100">
            Updated
          </div>
        </div>
      }
    return (
      <div className="row mb-2 border-bottom">
        <div className="col-auto">{this.props.index}</div>
        <div className="col-auto">{this.state.invoice.username}</div>
        <div className="col">{this.state.invoice.name}</div>
        <div className="col">{this.state.invoice.date}</div>
        <div className="col-2">{this.state.invoice.invoice}</div>
        <div className="col-auto px-3">{this.state.invoice.value}</div>
        <div className="col-auto">{this.state.invoice.paid}</div>
        <div className="col-2">{progress}</div>
      </div>
    );
  }
}


class 
EditDialog extends React.Component {

    constructor(props) {
        super(props);
        this.profiles = this.props.profiles;
        this.state = {
            items:[],
            // show: this.props.show,
            skipHead: true
        }
    }


    hide = (e) => {
        this.props.show()
    };

    skipHeaderEvent = (e) => {
        this.setState({
            skipHead: e.target.checked
        })
    };

    load_workbook = (data) => {
        console.log(data, new Date());
        let wb = XLSX.read(data, {type: "array"});
        this.process_workbook(wb);
        console.log(wb);
    };


    process_workbook = (workbook) => {
        var first_sheet_name = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[first_sheet_name];
        console.log("Worksheet", worksheet);
        let rows = worksheet["!ref"].split(":")[1];
        let row = Number(rows.match("[0-9]+")[0]);
        let skipHeader = this.state.skipHead;
        let start = 1;
        if (skipHeader)
            start += 1;
        
        let items = [];
        for (let i = start; i <= row; i++) {
            if (!worksheet.hasOwnProperty("A" + i)) {
                continue;
            }
            let getOrNull= (c)=>{
                if(worksheet.hasOwnProperty(c))
                    return worksheet[c].v
                return null;
            }

            let username = getOrNull("A" + i);
            let name = getOrNull("B" + i);
            let invoice = getOrNull("C" + i);
            let newDate = getOrNull("D" + i);
            let value = getOrNull("E" + i);
            let paid = getOrNull("F" + i);
            let alternative_name = getOrNull("G" + i)
            
            items.push({username:username,name:name, date: newDate, invoice:invoice, state:null, paid:paid,value:value, alternative_name:alternative_name})
        }

        this.setState({
            items:items
        })
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

    

    saveEdits = () => {
        this.props.onSave(this.profiles)
    };

    render() {
        return (
            <div className="over-layer show" id="externalDataScreen">
                <div className='content bg-white'>
                    <div className="row mb-2">
                        <div className="col"></div>
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
                            <input checked={this.state.skipHead} onChange={this.skipHeaderEvent} type="checkbox" name="skipHeader" id="skipHeader"/>
                            <label htmlFor="skipHeader">Skip header.</label>
                        </div>
                    </div>
                    

                    <div className="container-fluid" id="externalDataScreenContent">
                        {this.state.items.map((item, i) => {
                            let key = item[0];
                            let v = item[1];

                            return <ItemRow key={"invoice_" + item.username} index={i+1} invoice={item}/>
                        })}
                    </div>
                </div>
            </div>
        );
    }
}


class UpdateView extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            show_adding_bills:false,
            show_adding_clients:false,
        };
    };
    showAddingClientsToggle = ()=>{
        this.setState ({
            // show_adding_bills:false,
            show_adding_clients:!this.state.show_adding_clients,
        });
    };
    
    showAddingBillsToggle = ()=>{
        this.setState  ({
            show_adding_bills:!this.state.show_adding_bills,
        });
    };


    render(){
        return(
            <div>
                <button onClick={(e)=>{this.setState({show_adding_bills:true})}} className="btn btn-light bg-white border-0 rounded-pill">استيراد الفواتير</button>
                {/*<button onClick={(e)=>{this.setState({show_adding_clients:true})}} className="btn btn-light bg-white border-0 rounded-pill">استيراد المستخدمين</button>*/}
                {this.state.show_adding_bills?<EditDialog show={this.showAddingBillsToggle}/>:""}
                {/*{this.state.show_adding_clients?<EditDialog show={this.showAddingClientsToggle} />:""}*/}
            </div>
        );
    }
}



let item = document.getElementById("uploadUpdates");
console.log(item)
const e = React.createElement;
ReactDOM.render(e(UpdateView), item);
