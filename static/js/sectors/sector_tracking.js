// sectorsContainer
var serverUrl = "10.255.255.19";
// var serverUrl = "127.0.0.1";
// var hostUrl = "127.0.0.1:8099";
var hostUrl = "10.255.255.15";
var clientId = "mqtt_js_client" + Math.random().toString(16).slice(2);
var client = new Paho.MQTT.Client(serverUrl, 1884, clientId);
let towers = [];
let sectors = [];
let clients = [];

let rxDangerAlert = -70; // means -65dbm
let rxWarningAlert = -67; // means -65dbm

let txDangerAlert = -70; // means -65dbm
let txWarningAlert = -67; // means -65dbm

let rqDangerAlert = 2; // means 10%
let rqWarningAlert = 5; // means 10%

let tqDangerAlert = 2; // means 10%
let tqWarningAlert = 5; // means 10%


function openWinbox(ip, user, pw) {


}

function publish(topic, message, onMessageDeliveredCallback) {
  message = new Paho.MQTT.Message(message);
  message.destinationName = topic;
  message.qos = 2;
  client.send(message);
}
function scanExcute(id, tower, start, end, usr, pw) {
  let data = {
    "id": id,
    "clients": [],
    "name": tower,
    "start_ip": start,
    "end_ip": end,
    "clients_username": usr,
    "clients_password": pw
  };
  publish("scan_tower", JSON.stringify(data))
}

function scanSectorExcute(id, usr, pw, tower, ip, port) {
  console.log("Start scan sector")
  let data = {
    "id": id,
    "name": tower,
    "ip": ip,
    "port": port,
    "username": usr,
    "password": pw,
    "tower": tower
  };
  publish("scan_sector", JSON.stringify(data))
}

function ipToInt(ip) {
  var parts = ip.split(".");
  var res = 0;
  res += parseInt(parts[0], 10) << 24;
  res += parseInt(parts[1], 10) << 16;
  res += parseInt(parts[2], 10) << 8;
  res += parseInt(parts[3], 10);

  return res;
}
function intToIP(ipl) {
  return ((ipl >>> 24) + '.' +
    (ipl >> 16 & 255) + '.' +
    (ipl >> 8 & 255) + '.' +
    (ipl & 255));
}

class ClientsView extends React.Component {

  sortOptions = [
    { "value": "rx", "name": "Rx" },
    { "value": "rx-", "name": "Rx (Reverse)" },
    { "value": "tx", "name": "Tx" },
    { "value": "tx-", "name": "Tx (Reverse)" },
    { "value": "rxq", "name": "Q(rx)" },
    { "value": "rxq-", "name": "Q(rx) (Reverse)" },
    { "value": "txq", "name": "Q(tx)" },
    { "value": "txq-", "name": "Q(tx) (Reverse)" },
    { "value": "ip", "name": "IP" },
    { "value": "ip-", "name": "IP (Reverse)" },
    { "value": "dist", "name": "Distance" },
    { "value": "dist-", "name": "Distance (Reverse)" },
    { "value": "account", "name": "Account" },
    { "value": "account-", "name": "Account (Reverse)" },

    { "value": "remote_max_ping", "name": "Max Ping" },
    { "value": "remote_max_ping-", "name": "Max Ping (Reverse)" },
    { "value": "remote_avr_ping", "name": "AVR Ping" },
    { "value": "remote_avr_ping-", "name": "AVR Ping (Reverse)" },
    { "value": "remote_min_ping", "name": "Min Ping" },
    { "value": "remote_min_ping-", "name": "Min Ping (Reverse)" },
    { "value": "local_ping", "name": "Network Ping" },  
    { "value": "local_ping-", "name": "Network Ping (Reverse)" },  
  ]

  pageSize = 50;

  constructor(props) {
    super(props);
    this.state = {
      tower: this.props.tower,
      search: "",
      sort: "ip",
      totalShow: this.pageSize,
    };
  }

  removeItem = (e) => {
    this.props.onDelete();
  };
  event = (key) => (e) => {
    let s = this.state;
    s[key] = e.target.value;
    s["totalShow"] = this.pageSize;
    this.setState(s);
  };

  showHistory = (client) => {
    this.setState({
      clientHistory: client
    })
  }

  hideHistory = () => {
    this.setState({
      clientHistory: null
    })
  }

  showMore = (totalShow) => (e) => {
    this.setState({
      totalShow: totalShow
    });
  }

  render() {
    let tower = this.props.tower;
    let sector = this.props.sector;
    let search = this.state.search;
    var api = this.state.openAPI;
    let towerClients = clients.filter((client) => {
      var f =
        client.account.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
        client.mac.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
        client.ip.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
        client.sector_name.toLocaleLowerCase().includes(search.toLocaleLowerCase());
      if (api != "all") {
        if (api == "open") f = f && client.api;
        if (api == "notOpen") f = f && client.api == false;
      }
      if(this.props.online_only == true){
        f = f && client.current_scan;
      }
      if (tower != null) f = client.tower == tower.id && f;
      if (sector != null) return client.sector_name == sector.name && f;
      
      return f;
    });

    towerClients.sort((a, b) => {
      if (this.state.sort == "rx") return a.rx - b.rx; 
      if (this.state.sort == "rx-") return b.rx - a.rx; // Reverse
      if (this.state.sort == "tx") return a.tx - b.tx;
      if (this.state.sort == "tx-") return b.tx - a.tx; // Reverse
      if (this.state.sort == "rxq") return a.rxq - b.rxq;
      if (this.state.sort == "rxq-") return b.rxq - a.rxq; // Reverse
      if (this.state.sort == "txq") return a.txq - b.txq;
      if (this.state.sort == "txq-") return b.txq - a.txq; // Reverse
      if (this.state.sort == "account") return a.account.localeCompare(b.account);
      if (this.state.sort == "account-") return b.account.localeCompare(a.account); // Reverse
      // if (this.state.sort == "remote_max_ping") return a.remote_max_ping - b.remote_max_ping;
      if (this.state.sort == "remote_avr_ping") return a.remote_avr_ping - b.remote_avr_ping;
      if (this.state.sort == "remote_avr_ping-") return b.remote_avr_ping - a.remote_avr_ping; // Reverse
      // if (this.state.sort == "remote_min_ping") return a.remote_min_ping - b.remote_min_ping;
      if (this.state.sort == "local_ping") return a.local_ping - b.local_ping;
      if (this.state.sort == "local_ping-") return b.local_ping - a.local_ping; // Reverse

      if (this.state.sort == "dist") { if (a.distance == "") return -1; else return a.distance - b.distance; }
      if (this.state.sort == "dist-") { if (a.distance == "") return -1; else return b.distance - a.distance; } // Reverse
      
      if (this.state.sort == "ip-") return ipToInt(b.ip) - ipToInt(a.ip) // Reverse

      return ipToInt(a.ip) - ipToInt(b.ip)
    })


    return (
      <div className="row">
        <div className="col-12  mb-3">

          <div className="container-fluid">
            <div className="row">

              <div className="col-6 p-0">
                Search
                <input
                  id="mainSearchField"
                  name="q"
                  type="text"
                  className="form-control border  rounded-pill"
                  onChange={this.event("search")}
                  value={this.state.search}
                  aria-label="Sizing example input"
                  aria-describedby="inputGroup-sizing-lg"
                />
              </div>
              <div class="col-3">
                Sort:
                <select
                  name="state"
                  className="form-control rounded-pill"
                  onChange={this.event("sort")}>
                  {this.sortOptions.map((v) => <option selected={v.value == this.state.sort} value={v.value}>{v.name}</option>)}
                </select>
              </div>
              <div class="col-3">
                API:
                <select
                  name="state"
                  className="form-control rounded-pill"
                  onChange={this.event("openAPI")}>
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="notOpen">Not open</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <table className="table table-sm table-hover">
          <thead className="table-light">
            <tr>
              <th scope="col">Account / PW </th>
              
              <th scope="col">Ping(AVR / Net)</th>
              
              <th scope="col">Dist (km)</th>
              <th scope="col">IP</th>
              <th scope="col">SECTOR</th>
              <th scope="col">Rx/Tx (dbm)</th>
              <th scope="col">Q(rx)/Q(tx)</th>
              <th scope="col">-</th>
              {/* <th scope="col"></th> */}
            </tr>
          </thead>
          <tbody>
            {towerClients.slice(0, this.state.totalShow).map((client, ind) => {
              var towerName = "";
              let clientTower = towers.findIndex(
                (v, ind) => client.tower == v.id
              );
              if (clientTower != -1) towerName = towers[clientTower].name;

              return (
                <tr key={`${ind}-${client.id}`} className="col-12 px-1" onClick={this.props.onClick}>

                  <td>
                    {ind + 1}. {client.account} {this.props.online_only?"":`/ ${client.password}`} {client.api ? (
                      <i class="bi bi-check"></i>
                    ) : (
                      <i class="bi bi-x"></i>
                    )}<br />
                    {client.mac}
                  </td>
                  <td>{client.remote_avr_ping} / {client.local_ping}ms</td>
                  <td>{client.distance}</td>
                  <td>{client.ip}</td>
                  <td>{client.sector_name}</td>
                  <td className={client.rx < rxDangerAlert || client.tx < txDangerAlert ? "bg-danger" : client.rx < rxWarningAlert || client.tx < txWarningAlert ? "bg-warning" : ""}>
                    {client.rx}/{client.tx}
                    <br />
                    {client.api ? "" : <small className="text-muted ">From sector</small>}
                  </td>
                  <td className={client.rxq < rqDangerAlert || client.txq < tqDangerAlert ? "bg-danger" : client.rxq < rqWarningAlert || client.txq < tqWarningAlert ? "bg-warning" : ""}>
                    {client.rxq}%/{client.txq}%
                  </td>
                  <td>
                    <button className={"btn btn-link"} onClick={(e) => {
                      this.showHistory(client)
                    }} >History</button>
                    <a href={`winbox:=${client.ip}=admin=atmcis@hti`} className={"btn btn-link border-0 p-0 m-0"} >Go Winbox</a>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        <nav aria-label="Page navigation example">
          <ul className="pagination justify-content-center">
            {/* <li className={`page-item ${!this.state.hasPrev? "disabled":"" }`}>
                            <a className="page-link" onClick={this.changePage(this.state.page-1)} href="#" aria-label="Previous">
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li> */}
            <li className="page-item"><a className="page-link" >{towerClients.length} / {towerClients.length > this.state.totalShow ? this.state.totalShow : towerClients.length}</a></li>

            <li className={`page-item ${this.state.totalShow >= towerClients.length ? "disabled" : ""}`}>
              <a className="page-link" onClick={this.showMore(this.state.totalShow + this.pageSize)} aria-label="Next">
                المزيد <span aria-hidden="true">&raquo;</span>
              </a>
            </li>
          </ul>
        </nav>
        {this.state.clientHistory != null ? <HistoryDialogView client={this.state.clientHistory} hide={this.hideHistory} /> : ""}
      </div>
    );
  }
}
class SectorsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tower: this.props.tower,
      delete: null,
      sector: props.sector
    };
  }


  removeItem = (e) => {
    this.props.onDelete();
  };

  delete = (sector) => {

  }

  refresh = () => {
    this.setState({ tower: this.state.tower });
  }
  componentWillReceiveProps(nextProps) {

    if (nextProps.tower !== this.props.tower) {
      this.setState({ tower: nextProps.tower })
    }
  }
  render() {
    let tower = this.state.tower;
    let towerSectors = sectors.filter((sector) => {
      if (tower != null) return sector.tower == tower.id;
      return true;
    });
    // var notAddedSectors = new Set(clients.filter((it,ind)=>
    //   sectors.findIndex((v,i)=>v.name == it.sector) == -1
    // ).map((v,ind)=>v.sector_name))
    // notAddedSectors = [...notAddedSectors.values()]


    return <div>
      <div className="col-8 px-1 text-start">
        <button type="button" onClick={(e) => { e.preventDefault(); towerSectors.forEach((sector) => { scanSectorExcute(sector.id, sector.username, sector.password, sector.tower, sector.sector_ip, sector.port); }) }} className="btn btn-light mx-1">
          <i className="bi bi-arrow-clockwise"></i> Refresh Sectors
        </button>
      </div>
      {this.state.sector != null ?
        <div className="col-8 px-1 text-end">
          <i class="bi bi-x-circle-fill text-secondary" onClick={(e) => { this.props.select(null); this.setState({ sector: null }) }}></i>
        </div> : ""}
      {towerSectors.map((sector, ind) => {
        let sectorClients = clients.filter((client) => {
          var f = client.sector_name == sector.name; 
          if(this.props.online_only){
            return f && client.current_scan;
          }
          return f;
        });
        let upsetClients = sectorClients.filter((c, i) => c.rxq < rqDangerAlert || c.txq < tqDangerAlert || c.rx < rxDangerAlert || c.tx < txDangerAlert)
        var bg = "border-0 bg-light";
        if (this.state.sector == sector)
          bg = "border bg-white";
        return (
          <div className="col-12 px-1" onClick={(e) => { this.props.select(sector); this.setState({ sector: sector }) }}>
            <div className={`card rounded-0 ${bg} mb-1`}>
              <div className="card-body row">
                <td className="col">
                  {sector.name}
                </td>
                <td className="col-auto">{sector.sector_ip}:{sector.port}</td>

                <td className="col-12">Mac: {sector.mac} - Noise: {sector.noise}</td>
                <td className="col">
                  Tower: {towers.find((it) => sector.tower == it.id)?.name}
                </td>
                <td className="col-6">Clients: {sectorClients.length} {" "} Upset: {upsetClients.length}</td>
                <div className="row">
                  <div className="col-9">
                    <button className={"btn btn-link border-0 p-0 m-0"} onClick={(e) => { e.preventDefault(); this.setState({ edit: sector }) }}>Edit</button> -
                    <button className={"btn btn-link border-0 p-0 m-0"} onClick={(e) => { this.setState({ delete: sector }) }}>Delete</button> -
                    <a href={`winbox:=${sector.ip}=${sector.username}=${sector.password}`} className={"btn btn-link border-0 p-0 m-0"} >Go Winbox</a>
                  </div>
                  <div className="col-3 text-end">
                    {sector.state != "WAITING" && sector.state != "RUNNING" ?
                      <i onClick={(e) => {
                        scanSectorExcute(sector.id, sector.username, sector.password, sector.tower, sector.sector_ip, sector.port);
                        sector.state = "WAITING";
                        this.props.select(sector);
                        // this.setState({sector:sector});
                      }} className="bi bi-arrow-clockwise"></i>
                      : ""}
                  </div>
                </div>
              </div>
            </div>
            {this.state.edit == sector ? <AddSectorDialogView sector={sector} hide={() => { this.setState({ edit: null }) }}
              success={this.refresh} /> : ""}
            {this.state.delete == sector ? <DeleteDialogView success={() => {
              this.deleted(sector);
              this.props.refresh();
            }}
              url={`/api/tower/sectors/${item.id}/delete`}
              message={`Sector ${sector.name}: ${sector.ip} - ${towers.find((it) => sector.tower == it.id).name}`}
              hide={() => { this.setState({ delete: null }) }} /> : ""}
          </div>
        );
      })}

      {/* {notAddedSectors.map((sector,ind)=>{
      let sectorClients = clients.filter((client) => {
        var f = client.sector == sector; // || client.mac.includes(search) || client.ip.includes(search) || client.sector.includes(search);
        return f;
      });
      return (
        <div className="col-12 px-1" onClick={this.props.onClick}>
          <div className="card rounded-0 border-0 bg-light mb-1">
            <div className="card-body row">
              <td className="col">
                {ind + 1}.{sector}
              </td>
              <td className="col">Clients: {sectorClients.length}</td>
            </div>
          </div>
        </div>
      );
    })} */}
    </div>;
  }
}
class TowerDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tower: this.props.tower,
      viewType: "sectors",
      sector: null,
      // order: this.props.order,
    };
  }

  viewTypeEvent = (e) => {
    this.setState({
      viewType: e.target.value,
    });
  };
  componentWillReceiveProps(nextProps) {
    if (nextProps.tower.id !== this.props.tower.id) {
      this.setState({ tower: nextProps.tower })
    }
  }

  render() {
    let tower = this.state.tower;
    return (
      <div className="row">

        <div className="col-3">
          <SectorsView online_only={this.props.online_only} tower={tower} s={this.state.tower} select={(s) => { this.setState({ sector: s }); }} selected={this.state.sector} />
        </div>
        <div className="col-9">
          <ClientsView online_only={this.props.online_only} tower={tower} sector={this.state.sector} />
        </div>
        {/* {this.state.viewType == "clients" ? (
          <ClientsView tower={tower} />
        ) : (
          <SectorsView tower={tower} />
        )} */}
      </div>
    );
  }
}

class TowerView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false,
      delete: false,
      tower: this.props.tower
    };
  }

  removeItem = (e) => {
    this.props.onDelete();
  };
  deleted = () => {
    towers = towers.filter((v) => v.id != this.props.tower.id)
  }

  render() {
    let item = this.state.tower;
    var clientsTower = item != null ? clients.filter((it, ind) => it.tower == item.id) : clients;
    if(this.props.online_only)
      clientsTower = clientsTower.filter((it,ind)=> it.current_scan === true)
    var bg = "bg-light shadow-sm ";
    if (this.props.selected)
      bg = "bg-secondry border ";
    if (item.state == "RUNNING")
      bg += " border-success";
    else if (item.state == "WATING")
      bg += " border-info";
    else bg += " border-light"
    // if(item.state == "FINI")
    //   bg += " border-success";

    let upsetClients = clientsTower.filter((c, i) => c.rxq < rqDangerAlert || c.txq < tqDangerAlert || c.rx < rxDangerAlert || c.tx < txDangerAlert)
    return (
      <div className="col-auto px-1" onClick={this.props.select}>
        <div className={`card rounded-0  ${bg}`}>
          <div className="card-body">
            <h5 className="card-title m-0">Tower: {item.name}</h5>
            <div>{`State: ${item.state}`}</div>
            <p className="m-0">
              Clients: {clientsTower.filter((it, ind) => it.api).length}/{clientsTower.length} Upset: {upsetClients.length}
            </p>
            <p className="m-0">IP: {item.start_ip}/{item.end_ip}</p>
            <div className="row">
              <div className="col-6">
                <button className={"btn btn-link border-0 p-0 m-0"} onClick={(e) => { e.preventDefault(); this.setState({ edit: true }) }}>Edit</button> -
                <button className={"btn btn-link border-0 p-0 m-0"} onClick={(e) => { this.setState({ delete: true }) }}>Delete</button>
              </div>
              <div className="col-6 text-end">
                {item.state != "WAITING" && item.state != "RUNNING" ?
                  <i onClick={(e) => { scanExcute(item.id, item.name, item.start_ip, item.end_ip, item.clients_username, item.clients_password); item.state = "WAITING" }} className="bi bi-arrow-clockwise"></i>
                  : ""}
              </div>
            </div>
          </div>
        </div>
        {this.state.edit ? <AddTowerDialogView success={() => { this.props.refresh(); this.refresh(); }} tower={item} hide={() => { this.setState({ edit: false }) }} /> : ""}
        {this.state.delete ? <DeleteDialogView success={() => {
          this.deleted();
          this.props.refresh();
        }} url={`/api/tower/${item.id}/delete`} message={`Tower ${item.name}: ${item.start_ip} - ${item.end_ip}`} hide={() => { this.setState({ delete: false }) }} /> : ""}
      </div>
    );
  }
}

class ClientView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      client: this.props.client,
    };
  }

  removeItem = (e) => {
    this.props.onDelete();
  };

  render() {
    let client = this.state.client;
    return (
      <tr className="col-auto px-1">
        {/* <div className="border p-1"> */}
        {/* <div className=" row"> */}
        <td className="col-12"> {client.account} </td>
        <td className="col-6"> {client.ip}</td>
        <td className="col-6"> {client.api ? "Opened" : "Not"}</td>
        {/* </div> */}
        {/* </div> */}
      </tr>
    );
  }
}

class MainView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      towers: towers,
      clients: clients,
      selectedTower: null,
    };
  }

  removeItem = (e) => {
    this.setState({
      towers: towers,
      clients: clients,
      selectedTower: null,
    })

  };




  select = (tower) => {
    this.setState({
      selectedTower: tower,
    });
    // this.props.onDelete();
  };

  render() {
    // let card = this.state.towers;
    return (
      <div className="row">
        <div className="col-12  border-end ">
          <div className="row flex-row flex-nowrap mb-3" style={{ "max-width": "100%", "overflow-x": "scroll" }}>


            {this.state.towers.map((item, i) => {
              return (
                <TowerView
                  tower={item}
                  selected={this.state.selectedTower == item}
                  select={(e) => {
                    this.select(null);
                    this.select(item);
                  }}
                  refresh={() => { this.props.refresh(); this.removeItem(); }}
                  online_only={this.props.online_only}
                />
              );
            })}
          </div>
        </div>
        <div className="col-12">
          {this.state.selectedTower != null ? (
            <TowerDetails tower={this.state.selectedTower} online_only={this.props.online_only} />
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}

class AddSectorDialogView extends React.Component {
  constructor(props) {
    super(props);
    var s = null;
    if (props.sector != null && typeof props.sector != typeof undefined)
      s = props.sector

    if (s == null) {
      this.state = {
        ip: "",
        port: "",
        username: "",
        password: "",
        saving: false,
      };
    } else {
      this.state = {
        ip: s.sector_ip,
        port: s.port,
        tower: s.tower,
        username: s.username,
        password: s.password,
        saving: false,
      };
    }
  }

  submit = (e) => {
    e.preventDefault();

    let view = this;
    var url = `/api/tower/sectors/add`;
    var method = "POST";
    this.setState({
      saving: true,
    });
    if (view.props.sector != null) {
      url = `/api/tower/sectors/${view.props.sector.id}/edit`;
      method = "PUT";
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
        sector_ip: this.state.ip,
        port: this.state.port,
        tower: this.state.tower,
        username: this.state.username,
        password: this.state.password,
      }),
      success: (res) => {
        if (view.props.sector == null) {
          sectors.push(res);
        } else {
          let indx = sectors.findIndex((v, i) => v.id == view.props.sector.id);
          if (indx != -1)
            sectors[indx] = res;
        }
        view.props.success();
        this.setState({
          saving: false,
        });
        view.props.hide();
      },
      error: (res) => {
        this.setState({
          saving: false,
        });
      },
    });
  };
  event = (type) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[type] = v;
    this.setState(s);
  };

  render() {

    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={(e) => { this.props.hide() }} />
        <div className="content bg-white">
          <form onSubmit={this.submit}>
            <fieldset disabled={this.state.saving}>
              <div className="row">
                <div className="col-8">
                  <div class="mb-3">
                    <label class="form-label">Sector IP:</label>
                    <input
                      onChange={this.event("ip")}
                      value={this.state.ip}
                      type="text"
                      class="form-control  rounded-pill"
                      placeholder="xxx.xxx.xxx.xxx"
                    />
                  </div>
                </div>
                <div className="col-4">
                  <div class="mb-3">
                    <label class="form-label">Port:</label>
                    <input
                      onChange={this.event("port")}
                      value={this.state.port}
                      type="text"
                      class="form-control rounded-pill"
                      placeholder="xxxx"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div class="mb-3">
                    <label class="form-label">Username:</label>
                    <input
                      onChange={this.event("username")}
                      value={this.state.username}
                      type="text"
                      class="form-control rounded-pill"
                      placeholder="xxx"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div class="mb-3">
                    <label class="form-label">Password:</label>
                    <input
                      onChange={this.event("password")}
                      value={this.state.password}
                      type="text"
                      class="form-control rounded-pill"
                      placeholder="xxx"
                    />
                  </div>
                </div>
                <div className="col-12">
                  <div class="mb-3">
                    <label class="form-label">Tower:</label>
                    <select
                      name="state"
                      className="form-control rounded-pill"
                      onChange={this.event("tower")}
                    >
                      <option value={null}>---</option>
                      {towers.map((tower, ind) => (
                        <option
                          value={tower.id}
                          selected={this.state.tower == tower.id}
                        >
                          {ind + 1} - {tower.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row mb-2">
                <div className="col">
                  <button onClick={this.saveEdits} className="btn btn-outline-info rounded-pill">
                    Save
                  </button>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
}

class AddTowerDialogView extends React.Component {
  constructor(props) {
    super(props);
    var t = null;
    if (props.tower != null && typeof props.tower != typeof undefined)
      t = props.tower
    if (t != null) {
      this.state = {
        tower: t,
        name: t.name,
        end_ip: t.end_ip,
        start_ip: t.start_ip,
        clients_username: t.clients_username,
        clients_password: t.clients_password
      };
    } else {
      this.state = {
        tower: t,
        name: "",
        end_ip: "",
        start_ip: "",
        clients_username: "",
        clients_password: "",
      };
    }
  }

  submit = (e) => {
    e.preventDefault();

    let view = this;
    var url = `/api/tower/add`;
    var method = "POST";
    this.setState({
      saving: true,
    });
    if (view.props.tower != null) {
      url = `/api/tower/${view.props.tower.id}/edit`;
      method = "PUT";
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
        start_ip: this.state.start_ip,
        end_ip: this.state.end_ip,
        name: this.state.name,
        clients_username: this.state.clients_username,
        clients_password: this.state.clients_password,
      }),

      success: (res) => {
        if (view.props.tower != null) {
          let i = towers.findIndex((v) => v.id == this.props.tower.id)
          towers[i] = res;
        } else {
          towers.push(res);
        }
        view.props.success();
        view.setState({
          saving: false,
        });

        view.props.hide();
      },
      error: (res) => {
        view.setState({
          saving: false,
        });
      },
    });
  };
  event = (type) => (e) => {
    let v = e.target.value;
    let s = this.state;
    s[type] = v;
    this.setState(s);
  };

  render() {
    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={this.props.hide} />
        <div className="content bg-white">
          <form onSubmit={this.submit}>
            <fieldset disabled={this.state.saving}>
              <div className="row">
                <div className="col-12">
                  <div class="mb-3">
                    <label class="form-label">Tower name:</label>
                    <input
                      onChange={this.event("name")}
                      value={this.state.name}
                      type="text"
                      class="form-control  rounded-pill"
                      placeholder="xxx"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div class="mb-3">
                    <label class="form-label">Start IP:</label>
                    <input
                      onChange={this.event("start_ip")}
                      value={this.state.start_ip}
                      type="text"
                      class="form-control rounded-pill"
                      placeholder="xxxx"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div class="mb-3">
                    <label class="form-label">End IP:</label>
                    <input
                      onChange={this.event("end_ip")}
                      value={this.state.end_ip}
                      type="text"
                      class="form-control rounded-pill"
                      placeholder="xxx"
                    />
                  </div>
                </div>


                <div className="col-6">
                  <div class="mb-3">
                    <label class="form-label">Clients username:</label>
                    <input
                      onChange={this.event("clients_username")}
                      value={this.state.clients_username}
                      type="text"
                      class="form-control rounded-pill"
                      placeholder=""
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div class="mb-3">
                    <label class="form-label">Clients password:</label>
                    <input
                      onChange={this.event("clients_password")}
                      value={this.state.clients_password}
                      type="text"
                      class="form-control rounded-pill"
                      placeholder=""
                    />
                  </div>
                </div>


              </div>

              <div className="row mb-2">
                <div className="col">
                  <button
                    onClick={this.saveEdits}
                    className="btn btn-outline-info rounded-pill"
                  >
                    Save
                  </button>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
}
class DeleteDialogView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      url: props.url,
    };
  }

  submit = (e) => {
    e.preventDefault();

    let view = this;
    var url = view.props.url;
    var method = "DELETE";
    this.setState({
      saving: true,
    });


    let token = $("input[name=csrfmiddlewaretoken]").val();
    $.ajax(url, {
      method: method,
      beforeSend: function (xhr, settings) {
        xhr.setRequestHeader("X-CSRFToken", token);
      },
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      success: (res) => {
        view.props.success();
        view.setState({
          saving: false,
        });
        view.props.hide();
      },
      error: (res) => {
        view.setState({
          saving: false,
        });
      },
    });
  };


  render() {

    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={this.props.hide} />
        <div className="content bg-white">
          <form onSubmit={this.submit}>
            <fieldset disabled={this.state.saving}>
              <div className="row">
                <div className="col-12 text-center">
                  <div class="mb-3">
                    <p class="form-label">Are you sure want to delete?</p>

                  </div>
                </div>

                <div className="col-12 text-center">
                  <div class="mb-3">
                    <div className="row">
                      <div className="col"></div>
                      <div className="col-2">
                        <button type="submit" className="btn btn-danger">Delete</button>
                      </div>
                      <div className="col-2">
                        <button onClick={(e) => { e.preventDefault(); this.props.hide(); }} className="btn btn-secondary">Cancel</button>
                      </div>
                      <div className="col"></div>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
}

class HistoryDialogView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      client: props.client,
      data: [],
    };
  }

  componentDidMount() {


    let view = this;
    var pk = view.state.client.account;
    var url = `http://${hostUrl}/api/tower/${pk}/history`;

    let token = $("input[name=csrfmiddlewaretoken]").val();
    $.ajax(url, {
      method: "GET",
      beforeSend: function (xhr, settings) {
        xhr.setRequestHeader("X-CSRFToken", token);
      },
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      success: (res) => {
        view.setState({
          data: [...res.results],
        });

      },
      error: (res) => {
        view.setState({
          saving: false,
        });
      },
    });
  };


  render() {
    let bg = "border-0 ";
    return (
      <div className={"over-layer show"} id="externalDataScreen">
        <div className={"over-layer show"} onClick={this.props.hide} />
        <div className="content bg-white">
          <form onSubmit={this.submit}>
            <fieldset disabled={this.state.saving}>
              <div className="row">
                <div className="col-12 text-center">
                  <div class="mb-3">
                    <h1>History</h1>
                    {this.state.client.detail != null ? <div>
                      <p className={"h2"}>{this.state.client.account} - {this.state.client.detail.firstname} - {this.state.client.detail.phone}</p>
                      <p className={"text-muted"}>Note: Client info fetched from SAS4 </p>
                    </div> : ""}
                  </div>
                </div>

                <div className="col-12">
                  <div class="mb-3">
                    <div className="row">
                      {this.state.data.map((history, i) => {
                        return <div className="col-12">
                          <div className={`card rounded-0  ${bg}`}>
                            <div className="card-body">
                              {i + 1}. {history.account} {history.api} - {history.mac} - {history.ip} - Tower: {towers.find((v) => v.id == history.tower).name}/{history.sector_name} - Rx/Tx: {history.rx}dbm/{history.tx}dbm -{history.timestamp}
                              {/* <h5 className="card-title m-0">Tower: {history.account}</h5> */}
                              {/* <p className="m-0">
                            {history.sector_name}
                            
                          </p>
                          <p className="m-0">IP: {history.mac}/{history.api}</p>            
                          <div> {history.timestamp}</div> */}
                            </div>
                          </div>
                          <hr />
                        </div>
                      })}




                    </div>



                  </div>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
}

class SectorTrackerView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      towers: towers,
      clients: clients,
      addSectorDialog: false,
      addTowerDialog: false,
      serverMessage: "Not connected",
      online_only: true
    };
  }

  componentDidMount() {
    let view = this;
    // let dataHost = `${hostUrl}:8000`;

    $.ajax(`http://${hostUrl}/api/tower/list?format=json`, {
      // beforeSend: function(jqXHR, settings) {
      //   jqXHR.setRequestHeader('Origin', "http://10.255.255.15");
      //       jqXHR.setRequestHeader('Host', "10.255.255.15");
      //       jqXHR.setRequestHeader('Referer', "http://10.255.255.15/api/tower/list");

      // },
      crossDomain: true,
      dataType: "json",
      // headers: {
      //   Referer: `http://${dataHost}/api/tower/list`,
      //   Host: "10.255.255.15",
      //   Origin: "http://10.255.255.15",
      // },
      success: (res) => {
        let items = res.results;
        towers.push(...items);

        $.ajax(`http://${hostUrl}/api/tower/sectors/list`, {
          beforeSend: function (jqXHR, settings) { },
          success: (res) => {
            let items = res.results;
            sectors.push(...items);
            this.setState({
              sectors: sectors,
              add: false,
              edit: null,
            });
          },
        });
        this.setState({
          towers: towers,
          add: false,
          edit: null,
        });
      },
    });
    this.loadAllClients(1);




    this.connect();
    client.onConnectionLost = (error) => {
      console.log(error);
      this.setState({
        serverMessage: `${error.errorCode} : ${error.message}`
      })
    }
  }
  loadAllClients(page) {
    $.ajax(`http://${hostUrl}/api/tower/clients/list?page=${page}`, {

      success: (res) => {
        let items = res.results;
        let next = res.next;
        clients.push(...items);
        this.setState({
          clients: clients,
        });

        if (next != null) {
          this.loadAllClients(page + 1);
        }
      },
    });
  }

  connect = () => {
    let view = this;
    client.onMessageArrived = function (message) {
      try {
        let data = JSON.parse(message.payloadString);

        if (message.destinationName == "clients") {
          let c = clients.findIndex((it, ind) => {
            if (data.mac.length > 0)
              return it.mac == data.mac;
            if (it.account.length > 0)
              return it.account == data.account;
            return it.ip == data.ip;
          });
          if (c == -1) {
            data.current_scan = true;
            clients.push(data);
          }
          else {
            data.id = clients[c].id;
            data.detail = clients[c].detail;
            data.current_scan = true;
            clients[c] = data;
          }
        } else if (message.destinationName == "clientsFromSector") {

          let c = clients.findIndex((it, ind) => it.mac == data.mac);

          if (c == -1){ 
            data.current_scan = true;
            clients.push(data);
          }
          else {
            clients[c].rx = data.rx;
            clients[c].tx = data.rx;
            clients[c].sector = data.sector;
            clients[c].sector_name = data.sector_name;
            clients[c].rxq = data.rxq;
            clients[c].txq = data.txq;
            clients[c].distance = data.distance;
            clients[c].current_scan = true;

          }
        } else if (message.destinationName == "sectors") {

          let secInd = sectors.findIndex((v) => v.id == data.id);

          sectors[secInd].noise = data.noise;
          sectors[secInd].name = data.name;
          sectors[secInd].mac = data.mac;
        }
        else if (message.destinationName == "status") {
          let type = data.type;
          let id = data.id;

          if (type == "SECTOR") {
            let c = sectors.findIndex((v) => v.id == id);
            sectors[c].state = data.state;
          }

          if (type == "TOWER") {
            let c = towers.findIndex((v) => v.id == id);
            towers[c].state = data.state;
          }
        }
        view.setState({
          towers: towers,
          sectors: sectors,
          clients: clients,
        });

      } catch (error) {
        // console.log(error);
      }
    };

    client.connect({
      onSuccess: () => {
        client.subscribe("clients");
        client.subscribe("clientsFromSector");
        client.subscribe("sectors");
        client.subscribe("status");
        this.setState({
          serverMessage: null
        })
      },
    });
  }

  refresh = () => {

    setTimeout(() => {
      this.setState({
        towers: towers,
        clients: clients,
      });
    }, 100)

  };

  success = () => {
    this.setState({
      towers: towers,
      clients: clients,
    });
  };

  event = (key, value) => (e) => {
    let s = this.state;
    s[key] = value;
    this.setState(s);
  };

  hideEvent = (key) => (event) => {
    this.setState({
      key: false,
    });
  };

  showOnlineOnlyEvent = (event) => {
    let v = event.target.checked;
    this.setState({
      online_only: v,
    });
  };

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-auto">
            <button type="button" onClick={(e) => { e.preventDefault(); scanExcute(-1, "", "", "") }} className="btn btn-light mx-1">
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>

            <button
              type="button"
              className="btn btn-light mx-1"
              onClick={this.event("addTowerDialog", true)}
            >
              <i class="bi bi-plus-lg"></i> Add Tower
            </button>

            <button
              type="button"
              className="btn btn-light mx-1"
              onClick={this.event("addSectorDialog", true)}
            >
              <i class="bi bi-plus-lg"></i> Add Sector
            </button>
          </div>
          <div className="col">
            <div class="form-check form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                name="inlineRadioOptions"
                id="towers_view"
                onChange={this.event("viewType", "towers")}
                value="towers"
              />
              <label class="form-check-label" for="towers_view">
                Towers
              </label>
            </div>

            <div class="form-check form-check-inline">
              <input
                class="form-check-input"
                type="radio"
                name="inlineRadioOptions"
                id="sectors_view"
                onChange={this.event("viewType", "sectors")}
                value="sectors"
              />
              <label class="form-check-label" for="sectors_view">
                Sectors
              </label>
            </div>
            <div class="form-check form-check-inline">
              <input
                class="form-check-input"
                onChange={this.event("viewType", "clients")}
                type="radio"
                name="inlineRadioOptions"
                value="clients"
                id="clients_view"
              />
              <label class="form-check-label" for="clients_view">
                Clients
              </label>
            </div>

            <div class="form-check form-check-inline">
              <input
                class="form-check-input"
                type="checkbox"
                name="online"
                id="online_scan_view"
                defaultChecked={this.state.online_only}
                onChange={this.showOnlineOnlyEvent}
                value="towers"
              />
              <label class="form-check-label" for="online_scan_view">
                Show online only
              </label>
            </div>
            {/* </div> */}
          </div>
        </div>
        <div className="row">
          <div
            className={this.state.selected == null ? "col-12" : "col-4 bg-light"}>
            <h3 className="text-center">User Monitor</h3>
            {this.state.viewType == "towers" ? (
              <MainView
                clients={this.state.clients}
                towers={this.state.towers}
                select={this.selectSeries}
                refresh={this.refresh}
                online_only={this.state.online_only}
              />
            ) : (
              ""
            )}
            {this.state.viewType == "sectors" ? (
              <SectorsView tower={null} online_only={this.state.online_only} />
            ) : (
              ""
            )}
            {this.state.viewType == "clients" ? (
              <ClientsView tower={null} online_only={this.state.online_only} />
            ) : (
              ""
            )}
          </div>
          {this.state.addSectorDialog ? (
            <AddSectorDialogView
              hide={this.event("addSectorDialog", false)}
              success={this.refresh}
            />
          ) : (
            ""
          )}
          {this.state.addTowerDialog ? (
            <AddTowerDialogView
              hide={this.event("addTowerDialog", false)}
              success={this.success}
            />
          ) : (
            ""
          )}
        </div>
        {/* Showing dialog for status of MQTT server */}
        <div style={{ "position": "fixed", "bottom": "10px", "left": "10px", "background": "white" }}>
          {this.state.serverMessage}
          <button onClick={(e) => { e.preventDefault(); if (!client.isConnected()) this.connect(); }} className={`btn ${client.isConnected() ? "btn-outline-success disabled" : "btn-outline-danger"}`}>
            {client.isConnected() ? "Connected" : "Not connected"}
          </button>
        </div>



      </div>
    );
  }
}

let item = document.getElementById("sectorsContainer");
const e = React.createElement;
ReactDOM.render(e(SectorTrackerView), item);
