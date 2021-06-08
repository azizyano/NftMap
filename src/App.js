import React, { Component } from "react";
import { Grid, Button, Form } from "react-bootstrap";
import "./App.css";
import nftmap from "./assets/logo.png";
import GoogleMapReact from "google-map-react";

const { Zilliqa } = require("@zilliqa-js/zilliqa");
const zilliqa = new Zilliqa("https://dev-api.zilliqa.com");

const AnyReactComponent = ({ text }) => <div>{text}</div>;
const ipfsAPI = require('ipfs-api')
class App extends Component {
  constructor () {
    super()
    this.state = {
      added_file_hash: "QmQTCa2UXTZaba3b63e8jGXQipgEN1PW9T9WCAP7GYWYYh",
      account: "",
      balance: "0",
      nftbalance: "0",
      networkId: "",
      contract: null,
      ipfsHash: null,
      buffer: "",
      ethAddress: "",
      blockNumber: "",
      transactionHash: "",
      gasUsed: "",
      txReceipt: "",
      tokenUri: "",
      imagePosition: null,
      latitude : '0',
      longitude: '0'

    }
    this.ipfsApi = ipfsAPI('localhost', '5001')
  }

  static defaultProps = {
    center: {
      lat: 59.95,
      lng: 30.33,
    },
    zoom: 11,
  };
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
    navigator.geolocation.getCurrentPosition(position => {
      const imagePosition = position.coords;
      const latitude = imagePosition.latitude;
      const longitude = imagePosition.longitude;
    this.setState({imagePosition: imagePosition, latitude: latitude,longitude: longitude })
    console.log(imagePosition)
    })
    
  }
  async loadWeb3() {
    const isConnect = await window.zilPay.wallet.connect();
    if (isConnect) {
      
    } else if (isConnect) {
      window.web3 = new window.zilPay.wallet.currentProvider();
    } else {
      window.alert(
        "Non-Zilliqa browser detected. You should consider trying ZilPay!"
      );
    }
  }

  async loadBlockchainData() {
    // Load account
    const accounts = await window.zilPay.wallet.defaultAccount;

    this.setState({ account: accounts.bech32 });
    const blockchain = window.zilPay.blockchain;
    const balance = await blockchain.getBalance(this.state.account);
    console.log(balance);
    this.setState({ balance: balance.result.balance });
    const networkId = await window.zilPay.wallet.net;
    this.setState({ networkId: networkId });

    if (networkId) {
      const contractAddress = "zil15v3d0jxaeglprqde7pmtllyd45jnd9dkr99fhj";
      const contract = zilliqa.contracts.at(contractAddress);

      this.setState({ contract });
      console.log(contract);
      const contractState = await contract.getState();
      console.log(contractState);
      let nftbalance = contractState.owned_token_count;
      for (var key in nftbalance) {
        this.setState({ nftbalance: nftbalance[key] });
      }
    } else {
      window.alert("Smart contract not deployed to detected network.");
    }
  }
  captureFile = (event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.onloadend = () => this.saveToIpfs(reader)
    reader.readAsArrayBuffer(file)
  }

  saveToIpfs = (reader) => {
    let ipfsId
    const buffer = Buffer.from(reader.result)
    this.ipfsApi.add(buffer)
    .then((response) => {
      console.log(response)
      ipfsId = response[0].hash
      console.log(ipfsId)
      this.setState({added_file_hash: ipfsId})
    }).catch((err) => {
      console.error(err)
    })
  }

  arrayBufferToString = (arrayBuffer) => {
    return String.fromCharCode.apply(null, new Uint16Array(arrayBuffer))
  }

  handleSubmit = (event) => {
    event.preventDefault()
  }
 
  position = () =>{
    const f = this.state.added_file_hash
    console.log(f)
    navigator.geolocation.getCurrentPosition(position => {
      const imagePosition = position.coords;
      console.log(imagePosition)
      // Show a map centered at latitude / longitude.
      let imgelink = 'https://ipfs.io/ipfs/'+this.state.added_file_hash;
      let data = {
        imgelink,
        imagePosition
      };
      console.log(data);
      var fs = require('browserify-fs'),
          path = require('path'),
          jsonData = JSON.stringify(data);
      fs.writeFile(path.join(__dirname,"nftdata.json"), jsonData, function(err){
        if (err) throw err;
        fs.readFile('nftdata.json', 'utf-8', function(err, data) {
          console.log(data.address);
      });
    });
 
    });
    
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar navbar-dark  bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={nftmap}
              width="30"
              height="30"
              className="d-inline-block align-top"
              alt=""
            />
            &nbsp; NFT Map
          </a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-muted">
                <span id="account">{this.state.account}</span>
              </small>
            </li>
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white">
                <span id="account">
                  Balance : {this.state.balance / 1000000000000}
                </span>
              </small>
            </li>
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white">
                <span id="account">Network : {this.state.networkId}</span>
              </small>
            </li>
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small className="text-white">
                <span id="account">NFT balnce : {this.state.nftbalance}</span>
              </small>
            </li>
          </ul>
        </nav>
        <div>
        <h3> 1. Choose your image to send to IPFS </h3>
          <form id="captureMedia" onSubmit={this.handleSubmit}>
            <input type="file" onChange={this.captureFile} />
          </form>
          <hr />
          <h4>  link and image: </h4>
          <div>
            <a target="_blank"
              href={'https://ipfs.io/ipfs/' + this.state.added_file_hash}>
              {this.state.added_file_hash}
            </a>
            <hr />
          <h4> 2. localisation date of your image: </h4>
          <span id="account"> latitude :{this.state.latitude}, longitude {this.state.longitude} </span>
          <hr />
            <div>
            
            <img src= {'https://ipfs.io/ipfs/' + this.state.added_file_hash} class="food1 rounded mx-auto d-block" alt="new" ></img>
            </div>
            <h4> 3. Mint your NFT in Zilliqa Blockchain : </h4>
          </div>
        </div>
        <Grid>
         
          <hr />
          <Button onClick={this.onClick}> Get Transaction Receipt </Button>
          <hr />
          <Button onClick={this.position}> Get NFT data  </Button>
          <hr />
          
          <div style={{ height: "100vh", width: "100%" }}>
            <GoogleMapReact
              bootstrapURLKeys={{
                key: "AIzaSyD7ZtHczV0jSdpl1Lx9Uhgt4KsYT_WdWTw",
              }}
              defaultCenter={{ lat: 30.397, lng: -9.644 }}
              defaultZoom={8}
            >
              <AnyReactComponent
                lat={this.state.latitude}
                lng={this.state.longitude}
                text="NFT location"
              />
            </GoogleMapReact>
          </div>
        </Grid>
      </div>
    );
  }
}

export default App;
