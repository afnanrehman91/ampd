import React, { Component } from "react";
import 'whatwg-fetch';
import { HashRouter as Router, Route, Link, NavLink } from "react-router-dom";
import SignUpForm from "../login/SignUpForm.jsx";
import SignInForm from "../login/SignInForm.jsx";
import MusicPlayer from "../MusicPlayer/MusicPlayer.jsx";
import "../../styles/styles.scss";
import axios from 'axios';
import Chat from "../Chat/Chat.jsx";
import io from "socket.io-client";

import {
    getFromStorage,
    setInStorage
  } from '../../utils/storage';


  let playlist = [
    {
      url:
        "http://res.cloudinary.com/alick/video/upload/v1502689683/Luis_Fonsi_-_Despacito_ft._Daddy_Yankee_uyvqw9.mp3",
      cover:
        "http://res.cloudinary.com/alick/image/upload/v1502689731/Despacito_uvolhp.jpg",
      title: "Despacito",
      artist: ["Luis Fonsi", "Daddy Yankee"]
    }
  ];

class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      error: false,
      token: '',
      signUpError: '',
      signInError: '',
      signInEmail: '',
      signInPassword: '',
      signUpEmail: '',
      signUpPassword: '',
      signUpFirstName: '',
      signUpLastName: '',
      hasAgreed: false,
      selectedFile: null,
      userName: "",
      message: "",
      messages: [],
      playList: [],
    };

//Socket configuration for chat component
    this.socket = io("localhost:8080");
    this.socket.on("RECEIVE_MESSAGE", function(data) {
      addMessage(data);
    });
    const addMessage = data => { //Socket configuration for chat component
        console.log("Data sent by server: " + data.author + ", " + data.message);
        this.setState({ messages: [...this.state.messages, data] });
        console.log(this.state.messages);
      };
  }
  sendMessage = ev => {
    ev.preventDefault();
    this.socket.emit("SEND_MESSAGE", {
      author: this.state.userName,
      message: this.state.message
    });
    this.setState({ message: "" });
  };

  componentWillMount(){
  }

  componentDidMount() {
    const obj = getFromStorage('the_main_app');

    this.setState({
      userName: obj.userName
    });

    if (obj && obj.token){
      const { token } = obj;
      //Verify token
      fetch('/api/account/verify?token=' + token)
        .then(res => res.json())
        .then(json => {
          if(json.success){
              this.setState({
                token,
                isLoading: false
              });
          } else{
            this.setState({
              isLoading: false,
            });
          }
        });
    } else {
            this.setState({
              isLoading: false
            });
        }
        // Getting the playlist
                 axios.get('/api/account/getlist')
                  .then(res => {
                    this.setState({
                      playList: res.data.songList
                    });
                    console.log("Playlist: "+this.state.playList);

                for (var counter = 0; counter < this.state.playList.length; counter++) {
                    let obj = {
                      url: this.state.playList[counter].url,
                      cover: this.state.playList[counter].cover,
                      title: this.state.playList[counter].title,
                      artist: [this.state.playList[counter].artist]
                    }
                    playlist.push(obj);
                  }
                    console.log("ahahaha: "+playlist);
                  });

                  //playlist.push(this.state.playList[0]);


  }

  handleChange = e => {
      let target = e.target;
      let value = target.type === 'checkbox' ? target.checked : target.value;
      let name = target.name;
      this.setState({
        [name]: value
      });
  }

  onSignIn = (event) => {
    const {
      signInEmail,
      signInPassword
    } = this.state;

    this.setState({
      isLoading: true,
    })

    fetch('/api/account/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: signInPassword,
        email: signInEmail,
      }),
    }).then(res => res.json())
      .then(json => {
        if (json.success) {
          setInStorage('the_main_app', { token: json.token,
                                         userName: json.userName,
           });
          this.setState({
          signInError: json.message,
          isLoading: false,
          signInEmail: '',
          signInPassword: '',
          userName: json.userName,
          token: json.token,
        });
      }else {
        this.setState ({
          signInError: json.message,
          isLoading: false,
        });
      }
      });
      console.log(this.signInError);

  }

  onSignUp = (event) => {

    const {
      signUpFirstName,
      signUpLastName,
      signUpEmail,
      signUpPassword
    } = this.state;

    this.setState({
      isLoading: true,
    })

    fetch('/api/account/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: signUpFirstName,
        lastName: signUpLastName,
        password: signUpPassword,
        email: signUpEmail,
      }),
    }).then(res => res.json())
      .then(json => {
        if (json.success) {
          this.setState({
          signUpError: json.message,
          isLoading: false,
          signUpEmail: '',
          signUpPassword: '',
          signUpFirstName: '',
          signUpLastName: '',
        });
      } else {
        this.setState ({
          signUpError: json.message,
          isLoading: false,
        });
      }
      });
  }

  logout = () => {
    this.setState({
      isLoading: true,
    });
    const obj = getFromStorage('the_main_app');
    if (obj && obj.token){
      const { token } = obj;
      //Verify token
      fetch('/api/account/logout?token=' + token)
        .then(res => res.json())
        .then(json => {
          if(json.success){
              this.setState({
                token: '',
                isLoading: false,
              });
          } else{
            this.setState({
              isLoading: false,
            });
          }
        });

    } else {
            this.setState({
              isLoading: false
            });
        }
  }

  handleUpload = e => {
    e.preventDefault();
    //console.log(e.target.files[0])
    this.setState({
      selectedFile: e.target.files[0]
    });
    //const { selectedFile } = this.state;
      let selectedFile = e.target.files[0]
        console.log(selectedFile)

        let formData = new FormData();

        formData.append('selectedFile', selectedFile);
        axios.post('/api/upload', formData)
          .then(response => {
             console.log(response.data);
             const obj = {
               url: response.data.url,
               cover: response.data.cover,
               title: response.data.title,
               artist: [response.data.artist]
             };
             playlist.push(obj);
             console.log(playlist);
           });
  };

  render() {

    return (
      <Router>
        <div className="App">
          <div className="App__Aside" />
          {!this.state.token && (

            <div className="App__Form">
              <div className="PageSwitcher">
                <NavLink
                  exact
                  to="/"
                  activeClassName="PageSwitcher__Item--Active"
                  className="PageSwitcher__Item"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/sign-up"
                  activeClassName="PageSwitcher__Item--Active"
                  className="PageSwitcher__Item"
                >
                  Sign Up
                </NavLink>
              </div>

              <div className="FormTitle">
                <NavLink
                  exact
                  to="/"
                  activeClassName="FormTitle__Link--Active"
                  className="FormTitle__Link"
                >
                  Sign In
                </NavLink>{" "}
                or{" "}
                <NavLink
                  to="/sign-up"
                  activeClassName="FormTitle__Link--Active"
                  className="FormTitle__Link"
                >
                  Sign Up
                </NavLink>
              </div>

              <Route exact path="/" render={(props) => (
                <SignInForm {...props} handleSubmit={this.onSignIn} email={this.state.signInEmail}
                  handleSignIn={this.handleChange} password={this.state.signInPassword}/>
              )}/>

              <Route path="/sign-up" render={(props) => (
                <SignUpForm {...props} handleSubmit={this.onSignUp} email={this.state.signUpEmail}
                  handleSignUp={this.handleChange} firstName={this.state.signUpFirstName}
                   lastName={this.state.signUpLastName} hasAgreed={this.state.hasAgreed }password={this.state.signUpPassword}/>
              )}/>

            </div>
          )}
          { this.state.token && (
              <div className="App__Player">

                <MusicPlayer
                  onUpload={this.handleUpload}
                  playlist={playlist}
                  handleLogout={this.logout}
                  autoplay
                />
                <Chat
                  messages={this.state.messages}
                  userName={this.state.userName}
                  message={this.state.message}
                  handleSend={this.sendMessage}
                  handleChange={this.handleChange}
                />
              </div>
            )}

        </div>
      </Router>
    );
  }
}

export default Home;
