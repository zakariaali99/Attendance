let items = [];
let billItems = [];
let data = null;
let custodies = [
  { name:"ahmed", time:"01-09-2021"},
  { name:"ahmed", time:"01-09-2021"},
  { name:"ahmed", time:"01-09-2021"},
  { name:"ahmed", time:"01-09-2021"}
];


class WaitingDialog extends React.Component{

  render(){
    return (
      <div className={""}>
        
      </div>
    )
  }
}



class MessageDialog extends React.Component{

  render(){
    return (
        <div className="floating-top">

        </div>
    )
  }
}
class CustodyListRow extends React.Component{
  render(){
    return (
      <tr>
      <th scope="row">1</th>
      <td >{this.props.name}</td>
      <td>{this.props.time}</td>
    </tr>
    )
  }
}
class CustodyList extends React.Component{

  render(){
    return(
      <table className="table">
  <thead>
    <tr>
      <th scope="col" className="col-auto">#</th>
      <th scope="col" className="col">First</th>
      <th scope="col" className="col-auto">time</th>
      
    </tr>
  </thead>
  <tbody>
    {this.props.custodies.map((item, i)=>{
      return <CustodyListRow key={"custody-"+i} time={item.name} name={item.time} />
    })}
    </tbody>
</table>
    );
  }
}


class InvoiceRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity: this.props.quantity,
    };
  }
  changeQuantity = (e) => {
    billItems[this.props.num].current_quantity = e.target.value;
    this.setState({
      quantity: e.target.value,
      disabled: this.props.disabled
    });
  };
  removeItem = (e) => {
    billItems.pop(this.props.num);
    this.props.onDelete();
  };
  render() {
    return (
      <tr>
        <th scope="row"> {this.props.num + 1} </th>
        <td> {billItems[this.props.num].code} </td>
        <td> {billItems[this.props.num].name} </td>
        <td>
          <input
          disabled={this.state.disabled}
            className="form-control rounded-pill"
            type="number"
            value={this.state.quantity}
            onChange={this.changeQuantity}
          />
        </td>
        <td>
          <button onClick={this.removeItem} className="btn">
            x
          </button>
        </td>
      </tr>
    );
  }
}

class InvoiceTabel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: items,
    };
  }

  componentDidMount() {
    $.ajax("/api/store/items/list", {
      success: (res) => {
        items = res;
        this.setState({
          items: billItems,
        });
      },
    });
  }

  addItem = (item) => {
    billItems.push({ name: item.name, code: item.code, quantity: 1, id:item.id });
    console.log(billItems);
    this.setState({
      items: billItems,
      disabled: this.props.disabled
    });
  };
  refresh = () => {
    this.setState({
      items: billItems,
    });
  };
  render() {
    return (
      <div>
        <table className="table">
          <thead>
            <tr>
              <th scope="col"> # </th>
              <th scope="col-1"> Number </th>
              <th scope="col"> Name </th>
              <th scope="col-1"> quantity </th>
              <th scope="col"> - </th>
            </tr>
          </thead>
          <tbody>
            {this.state.items.map((item, i) => {
              return (
                <InvoiceRow
                disabled={this.state.disabled}
                  onDelete={this.refresh}
                  key={"invoice_item_" + i}
                  num={i}
                  name={item.name}
                  number={item.number}
                  quantity={item.quantity}
                />
              );
            })}

            <tr>
              <td colSpan="3">
                <Autocomplete
                  onClick={(item) => this.addItem(item)}
                  suggestion={items}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}
let i = 0;
class ButtonAddItem extends React.Component {
  render() {
    return (
      <button className="btn btn-primary" onClick={this.props.onClick}>
        Add item
      </button>
    );
  }
}
class Autocomplete extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestion: props.suggestion,
      show: false,
      itemName: "",
    };
  }

  foucs = (e) => {
    this.setState({
      // show:true
    });
  };

  blur = (e) => {
    this.setState({
      show: false,
    });
  };

  change = (e) => {
    let text = e.target.value;
    let its = this.props.suggestion.filter(
      (v) =>
        (String(v.name).indexOf(text) != -1) |
        (String(v.code).indexOf(text) != -1)
    );

    this.setState({
      suggestion: its,
      itemName: text,
    });
  };

  submitAction = (e) => {
    e.preventDefault();
    let name = this.state.itemName;
    let it = items.find((i) => i.name == name);
    if (typeof it != "undefined") {
      this.props.onClick(it);
      this.setState({
        itemName: "",
        itemNumber: "",
      });
    }
  };
  render() {
    return (
      <div className="autocomplete" onFocus={this.foucs} onBlur={this.blur}>
        <form onSubmit={this.submitAction}>
          <div className="row">
            <div className="col">
              <input
                list="suggestion"
                type="text"
                value={this.state.itemName}
                className="form-control rounded-pill search-input"
                onChange={this.change}
                placeholder="Item name"
              />
              <datalist id="suggestion">
                {this.state.suggestion.map((v, i) => {
                  return (
                    <option key={"search_item_" + i} value={v.name}>
                      {v.name}
                    </option>
                  );
                })}
              </datalist>
            </div>
            <div className="col-auto">
              <button
                type="button"
                onClick={this.submitAction}
                className="btn btn-outline-secondary rounded-pill"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

class Invoice extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      client: "",
      loading: false,

    };
  }

  changeEmployee = (e) => {
    let text = e.target.value;
    this.setState({
      client: text,
    });
  };

  saveItems = (e) =>{
    this.setState({
      loading: true
    });

    console.log(this.state);
    let client = this.state.client;
    let token = $("input[name=csrfmiddlewaretoken]").val();
    items = billItems;
    console.log("Saving bill items");
    $.ajax("/api/store/custody/save",{
      method:'post',
      contentType: "application/json; charset=utf-8",
      beforeSend: function (xhr, settings) {
        xhr.setRequestHeader("X-CSRFToken", token);
    },
      data:JSON.stringify({
        "items":billItems,
        "csrfmiddlewaretoken": token,
        "client": client
      }),
      success: (data) =>{
        this.setState({
          loading: false
        });
      },
      error: (data) =>{
        this.setState({
          loading: false
        });
      }
    });


  }

  render() {
    return (
      // <form method="post">

      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="mb-3">
              <label className="form-label">الاسم</label>
              <input
              
                type="text"
                onChange={this.changeEmployee}
                name="employee"
                value={this.state.client}
                className="form-control rounded-pill"
                placeholder="الموظف"
                required=""
                id="id_employee"
              disabled={this.state.loading? "disabled" :""}
              ></input>
            </div>
          </div>
          {/* <div id="invoiceContainer"></div> */}
          <InvoiceTabel disabled={this.state.loading? "disabled" :""} />

          <div className="col"></div>
          <div className="col-3 mt-5">
            <button type="submit"
            onClick={this.saveItems}
            disabled={this.state.loading? "disabled" :""}
              className="btn btn-primary w-100 rounded-pill">
              Save
            </button>
          </div>
          <div className="col"></div>
        </div>
      </div>
    );
  }
}


class StoreCustodyView extends React.Component{
  constructor(props){
    super();
    this.state = {
      custodies:custodies
    }
  }
  componentDidMount() {
    $.ajax("/api/store/custody/list", {
      success: (res) => {
        custodies = res;
        this.setState({
          custodies: custodies,
        });
      },
    });
  }

  render(){
    return (<div className="container-fluid">
    <div className="row">
      <div className="col">
      
      </div>
      <div className="col-6">
      <Invoice/>
        
      </div>
      <div className="col-3">
      <CustodyList custodies={this.state.custodies}/>
      </div>
    </div>
  </div>);
  }
}

let item = document.getElementById("invoiceContainer");
const e = React.createElement;
ReactDOM.render(e(StoreCustodyView), item);
