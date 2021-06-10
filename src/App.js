import React, { Component } from "react";
import { Grid, Button, Form } from "react-bootstrap";
import "./App.css";
import nftmap from "./assets/logo.png";
import GoogleMapReact from "google-map-react";

const { Zilliqa } = require("@zilliqa-js/zilliqa");
const { BN, Long, bytes, units } = require("@zilliqa-js/util");
const zilliqa = new Zilliqa("https://dev-api.zilliqa.com");

const AnyReactComponent = ({ text }) => <div>{text}</div>;
const ipfsAPI = require("ipfs-api");
class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.zilPay) {
      const zilliqa = window.zilPay;
      await zilliqa.wallet.connect();
      this.setState({ zilliqa });
    } else {
      window.alert(
        "Non-Zilliqa browser detected. You should consider trying ZilPay!"
      );
    }
  }
  componentDidMount(){
    this.setState({
      markers: [{lat: this.state.latitude, lng: this.state.longitude, img_src: this.state.imagelink}],
    });
  }
  async loadBlockchainData() {
    navigator.geolocation.getCurrentPosition((position) => {
      const imagePosition = position.coords;
      const latitude = imagePosition.latitude;
      const longitude = imagePosition.longitude;
      this.setState({
        imagePosition: imagePosition,
        latitude: latitude,
        longitude: longitude,
      });
    });
    // Load account
    const accounts = await window.zilPay.wallet.defaultAccount;

    this.setState({ account: accounts.bech32 });
    const blockchain = window.zilPay.blockchain;
    const balance = await blockchain.getBalance(this.state.account);
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
      let token_uris = contractState.token_uris
      const response = await fetch(token_uris[2]);
      console.log(token_uris[2])
      if(!response.ok)
        throw new Error(response.statusText);
      const json = await response.json();
      this.setState({imagelink: json.imgelink})
    } else {
      window.alert("Smart contract not deployed to detected network.");
    }
    this.setState({ loading: false });
  }
  captureFile = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    let reader = new window.FileReader();
    reader.onloadend = () => this.saveToIpfs(reader);
    reader.readAsArrayBuffer(file);
  };

  saveToIpfs = (reader) => {
    let ipfsId;
    const buffer = Buffer.from(reader.result);
    this.ipfsApi
      .add(buffer)
      .then((response) => {
        console.log(response);
        ipfsId = response[0].hash;
        console.log(ipfsId);
        this.setState({ added_file_hash: ipfsId });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  arrayBufferToString = (arrayBuffer) => {
    return String.fromCharCode.apply(null, new Uint16Array(arrayBuffer));
  };

  handleSubmit = (event) => {
    event.preventDefault();
  };

  senddata = () => {
    let ipfsId;
    let imgelink = "https://ipfs.io/ipfs/" + this.state.added_file_hash;
    let latitude = this.state.latitude;
    let longitude = this.state.longitude;
    let data = {
      imgelink,
      latitude,
      longitude,
    };
    const Data = JSON.stringify(data);
    const buffer = Buffer.from(Data);
    this.ipfsApi.add(buffer);
    this.ipfsApi
      .add(buffer)
      .then((response) => {
        console.log(response);
        ipfsId = response[0].hash;
        console.log(ipfsId);
        this.setState({ added_data_hash: ipfsId });
      })
      .catch((err) => {
        console.error(err);
      });
  };
  mint = async () => {
    const nftlink = "https://ipfs.io/ipfs/" + this.state.added_data_hash;
    const myGasPrice = units.toQa("2000", units.Units.Li);
    try {
      const tx = await this.state.contract.call(
        "Mint",
        [
          {
            to: this.state.account,
            type: "ByStr20",
          },
          {
            token_uri: nftlink,
            type: "String",
          },
        ],
        {
          amount: new BN(0),
          gasPrice: myGasPrice,
          gasLimit: Long.fromNumber(8000),
        },
        true
      );
    } catch (err) {
      console.log(err);
    }
  };
  constructor() {
    super();
    this.state = {
      added_file_hash: "QmQTCa2UXTZaba3b63e8jGXQipgEN1PW9T9WCAP7GYWYYh",
      added_data_hash: null,
      zilliqa: null,
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
      latitude: "0",
      longitude: "0",
      imagelink: "",
      markers: [],
    };
    this.ipfsApi = ipfsAPI("localhost", "5001");
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
            <img src={nftmap} alt="" />
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
                <span id="account">total supply : {this.state.nftbalance}</span>
              </small>
            </li>
          </ul>
        </nav>
        <div>
        <div className="row mx-auto l-3 r-3">
          <div className="container-fluid mt-5 " >
            <div class="p-3 mb-2 text-center bg-light text-dark">
              <p>NFT Map  <br />
                  Create your NFT in Zilliqa Blockchain. <br />
              to create your nft you will need enable geolocation location. <br />
              1. upload your photo <br />
              2. upload nft data.<br />
              3. you will see a new  ipsf link of your data. <br />
              4. visit https://ide.zilliqa.com/#/ and load contract 
0xa322d7c8ddca3e1181b9f076bffc8dad253695b6 <br />
              5. put ipfs data link and click mint <br />
               <br />
              </p>
            </div>
          </div>
        </div>
          <h3> 1. Choose your image to send to IPFS </h3>
          <Form id="captureMedia" onSubmit={this.handleSubmit}>
            <input type="file" onChange={this.captureFile} />
          </Form>
          <hr />
          <small>
            {" "}
            the link and the image will updated every time you choose an image.{" "}
          </small>
          <div className="polaroid">
            <img
              src={"https://ipfs.io/ipfs/" + this.state.added_file_hash}
              alt="nft"
              className="width:100%"
            ></img>
            <div className="container">
              <p>
                latitude :{this.state.latitude}, longitude{" "}
                {this.state.longitude}
              </p>
            </div>
          </div>
          <hr />
          <div>
            <a
              target="_blank"
              href={"https://ipfs.io/ipfs/" + this.state.added_file_hash}
            >
              {"https://ipfs.io/ipfs/" + this.state.added_file_hash}
            </a>
            <hr />

            <h4> 3. Mint your NFT in Zilliqa Blockchain : </h4>
            <a
              target="_blank"
              href={"https://ipfs.io/ipfs/" + this.state.added_data_hash}
            >
              {this.state.added_data_hash}
            </a>
            <hr />
          </div>
        </div>
        <Button
          onClick={this.senddata}
          className="btn btn btn-info btn-block btn-lg"
        >
          {" "}
          upload image link and localisation to IPFS{" "}
        </Button>
        
        <hr />
        <Button
          onClick={this.mint}
          className="btn btn btn-info btn-block btn-lg"
        >
          Mint NFT
        </Button>
        <Grid>
          <div style={{ height: "100vh", width: "100%" }}>
            <GoogleMapReact
              bootstrapURLKeys={{
                key: "AIzaSyBR_22LQdEu2gD6jef8E0B7FjisiuxQ8R8",
              }}
              defaultCenter={{ lat: 30.397, lng: -9.644 }}
              defaultZoom={12}
            >
                {this.state.markers.map((marker, i) =>{
              return(
                <AnyReactComponent
                  lat={marker.lat}
                  lng={marker.lng}
                  img_src={marker.img_src}
                />

              )
            })}  
            </GoogleMapReact>
          </div>
        </Grid>
      </div>
    );
  }
}

export default App;
