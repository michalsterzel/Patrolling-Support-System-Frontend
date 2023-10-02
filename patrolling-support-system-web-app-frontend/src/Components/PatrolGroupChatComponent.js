import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  createTheme,
} from "@mui/material";
import { Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import * as React from "react";
import { auth } from "../firebase-config.js";
import {
  addDoc,
  and,
  collection,
  documentId,
  getDocs,
  getFirestore,
  onSnapshot,
  or,
  where,
} from "firebase/firestore";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import SendIcon from "@mui/icons-material/Send";
import { query } from "firebase/database";
import moment from "moment";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Loader } from "@googlemaps/js-api-loader";

const markerIconGreen = {
  path: "M-0.547 -10c-5.523 0-10 4.477-10 10 0 6.628 10 22 10 22s10-15.372 10-22c0-5.523-4.477-10-10-10zm1 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  fillColor: "green",
  fillOpacity: 0.9,
  strokeWeight: 0,
  rotation: 0,
  scale: 1,
};

const markerIconRed = {
  path: "M-0.547 -10c-5.523 0-10 4.477-10 10 0 6.628 10 22 10 22s10-15.372 10-22c0-5.523-4.477-10-10-10zm1 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  fillColor: "red",
  fillOpacity: 0.9,
  strokeWeight: 0,
  rotation: 0,
  scale: 1,
};


const mdTheme = createTheme({
  palette: {
    primary: {
      main: "#A9AC5D",
    },
    secondary: {
      main: "#E8E1DB",
    },
    tertiary: {
      default: "#3A3C26",
    },
    background: {
      default: "#E8E1DB",
    },
  },
});

const loader = new Loader({
  apiKey: "AIzaSyBRx2VHwF6GZaONNSYekgsUTRZ6vrMN1FA",
});

const mapContainerStyle = {
  margin: 0,
  padding: 0,
  width: "100%",
  height: "630px",
};

// const OutlinedListItemText = styled(ListItemText)(({ theme }) => ({
//   border: `1px solid ${theme.palette.divider}`,
//   borderRadius: theme.shape.borderRadius,
//   padding: theme.spacing(1),
//   maxWidth: 'auto',
// }));

const PatrolGroupChatComponent = ({ documentData, patrolParticipantId }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  const { taskId } = useParams();

  const currentUserId = auth.currentUser.uid;

  const [chatList, setChatList] = React.useState([]);

  const [currentChat, setCurrentChat] = React.useState();

  // Message localization dialog

  const [openLocalization, setOpenLocalization] = React.useState(false);

  const handleClickOpenLocalization = () => {
    setLocalizationLoaded(true);
    setOpenLocalization(true);
  };

  const handleCloseLocalization = () => {
    setOpenLocalization(false);
  };

  const handleChatMessageClick = (localization) => {
    // console.log("Message clicked! Localization: ", localization);
    setClickedMessageLocalization(localization);
  };

  const [localizationLoaded, setLocalizationLoaded] = React.useState(false);
  const [clickedMessageLocalization, setClickedMessageLocalization] =
    React.useState(null);

  // ----------------------------------------------------------------------
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendClick();
    }
  };

  const getChatUsersDataFromFirestore = async () => {
    if (auth.currentUser) {
      const database = getFirestore();
      const collectionRef = collection(database, "Users");
      const documentQuery = query(
        collectionRef,
        where(documentId(), "in", documentData.patrolParticipants)
      );
      const querySnapshot = await getDocs(documentQuery);
      const chatParticipantsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const participant = {
          userId: data.userId,
          name: data.name,
          surname: data.surname,
        };
        chatParticipantsData.push(participant);
      });
      setChatList(chatParticipantsData);

      if (patrolParticipantId != null) {
        setCurrentChat(patrolParticipantId);
      } else {
        setCurrentChat(chatParticipantsData[0].userId);
      }
    }
  };

  const [messageList, setMessageList] = React.useState([]);

  const getMessagesFromFirestore = async (
    taskId,
    currentUserId,
    chatParticipantId
  ) => {
    if (auth.currentUser) {
      const database = getFirestore();
      const messagesRef = collection(database, "Chat");
      const messageQuery = query(
        messagesRef,
        where("taskId", "==", taskId),
        or(
          and(
            where("receiverId", "==", currentUserId),
            where("senderId", "==", chatParticipantId)
          ),
          and(
            where("receiverId", "==", chatParticipantId),
            where("senderId", "==", currentUserId)
          )
        )
      );

      const unsubscribe = onSnapshot(messageQuery, (querySnapshot) => {
        const chatMessages = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const messageData = {
            message: data.message,
            senderId: data.senderId,
            receiverId: data.receiverId,
            date: data.date,
            location: data.location,
          };
          chatMessages.push(messageData);
        });
        const sortedMessageData = chatMessages.sort((a, b) => a.date - b.date);
        setMessageList(sortedMessageData);
        setIsLoaded(true);
      });
    }
  };

  const [currentMessage, setCurrentMessage] = React.useState("");
  const handleChatBoxChange = (event) => {
    setCurrentMessage(event.target.value);
    // console.log(event.target.value);
  };

  const handleSendClick = () => {
    const currentDate = new Date();
    sendMessageToFirebase(
      taskId,
      currentMessage,
      currentDate,
      currentUserId,
      currentChat
    );
    handleChatBoxChange({ target: { value: "" } });
  };

  const sendMessageToFirebase = async (
    taskId,
    message,
    date,
    senderId,
    receiverId
  ) => {
    if (auth.currentUser) {
      const database = getFirestore();
      const collectionRef = collection(database, "Chat");
      const docRef = await addDoc(collectionRef, {
        taskId: taskId,
        message: message,
        date: date,
        senderId: senderId,
        receiverId: receiverId,
      });
      // console.log("Added new document with ID: ", docRef.id);
    }
  };

  const handleChatItemClick = (personId) => {
    setCurrentChat(personId);
  };

  const listContainerRef = React.useRef(null);

  const scrollToBottom = () => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const { isMapLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBRx2VHwF6GZaONNSYekgsUTRZ6vrMN1FA",
  });

  React.useEffect(() => {
    setIsLoaded(false);
    getChatUsersDataFromFirestore();
  }, []);

  React.useEffect(() => {
    getMessagesFromFirestore(taskId, currentUserId, currentChat);
  }, [currentChat]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  React.useEffect(() => {
    if (clickedMessageLocalization !== null) {
      handleClickOpenLocalization();
    }
  }, [clickedMessageLocalization]);

  return (
    <div>
      <React.Fragment>
        <Paper
          variant="outlined"
          sx={{
            my: { xs: 3, md: 6 },
            p: { xs: 2, md: 3 },
            position: "relative",
          }}
        >
          {isLoaded ? (
            <Grid container component={Paper}>
              <Grid item xs={2}>
                <Dialog
                  open={openLocalization}
                  onClose={handleCloseLocalization}
                  fullWidth
                >
                  <DialogTitle>Message location:</DialogTitle>
                  <DialogContent>
                    {localizationLoaded ? (
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={15}
                        center={{
                          lat: Number.parseFloat(
                            clickedMessageLocalization._lat
                          ),
                          lng: Number.parseFloat(
                            clickedMessageLocalization._long
                          ),
                        }}
                      >
                      
                        // adding checkpoints to map
                        {documentData.checkpoints?.map((checkpoint, index) => {
                          const lat = Number.parseFloat(checkpoint._lat);
                          const long = Number.parseFloat(checkpoint._long);
                          var marker = (
                            <Marker
                              icon={markerIconGreen}
                              key={index}
                              position={{
                                lat: lat,
                                lng: long,
                              }}
                              opacity={0.9}
                              label={{
                                text: (index+1).toString(),
                                fontSize: "15px",
                                fontWeight: "bold",
                              }}
                            />
                          );
                          return marker;
                        })}
                        // message report
                        <Marker
                          icon={markerIconRed}
                          position={{
                            lat: Number.parseFloat(
                              clickedMessageLocalization._lat
                            ),
                            lng: Number.parseFloat(
                              clickedMessageLocalization._long
                            ),
                          }}
                          label={{
                            text: "●",
                            fontSize: "23px",
                            fontWeight: "bold",
                          }}
                        />
                      </GoogleMap>
                    ) : null}
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseLocalization}>Cancel</Button>
                  </DialogActions>
                </Dialog>
                <List>
                  {chatList.map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        button
                        onClick={() => handleChatItemClick(item.userId)}
                      >
                        <ListItemText
                          primary={`${item.name} ${item.surname}`}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Grid>
              <Divider orientation="vertical" flexItem />
              <Grid item xs={9}>
                <List
                  style={{
                    maxHeight: "600px",
                    overflow: "auto",
                    minHeight: "600px",
                  }}
                >
                  {messageList.length === 0 ? (
                    <Grid>
                      <Typography variant="h5" align="center">
                        No messages to/from user yet.
                      </Typography>
                    </Grid>
                  ) : (
                    messageList.map((item, index) => {
                      if (item.senderId === currentUserId) {
                        return (
                          <ListItem key={index}>
                            <Grid container>
                              <Grid item xs={12}>
                                <ListItemText align="right">
                                  <TextField
                                    variant="outlined"
                                    margin="normal"
                                    multiline
                                    value={item.message}
                                    disabled
                                    InputProps={{
                                      style: {
                                        backgroundColor: "#A9AC5D",
                                        borderRadius: 30,
                                      },
                                    }}
                                    sx={{
                                      "& .MuiInputBase-input.Mui-disabled": {
                                        WebkitTextFillColor: "#000000",
                                      },
                                    }}
                                  />
                                </ListItemText>
                              </Grid>
                              <Grid item xs={12}>
                                <ListItemText
                                  align="right"
                                  secondary={moment(item.date.toDate()).format(
                                    "DD/MM/YYYY HH:mm"
                                  )}
                                />
                              </Grid>
                            </Grid>
                          </ListItem>
                        );
                      } else {
                        return (
                          <ListItem key={index}>
                            <Grid container>
                              <Grid item xs={12}>
                                {/* <OutlinedListItemText align="left" primary={item.message} /> */}
                                <ListItemText align="left">
                                  <TextField
                                    variant="outlined"
                                    margin="normal"
                                    multiline
                                    value={item.message}
                                    onClick={() =>
                                      handleChatMessageClick(item.location)
                                    }
                                    disabled
                                    InputProps={{
                                      style: {
                                        backgroundColor: "#A9AC5D",
                                        borderRadius: 30,
                                      },
                                    }}
                                    sx={{
                                      "& .MuiInputBase-input.Mui-disabled": {
                                        WebkitTextFillColor: "#000000",
                                      },
                                    }}
                                  />
                                </ListItemText>
                              </Grid>
                              <Grid item xs={12}>
                                <ListItemText
                                  align="left"
                                  secondary={moment(item.date.toDate()).format(
                                    "DD/MM/YYYY HH:mm"
                                  )}
                                />
                              </Grid>
                            </Grid>
                          </ListItem>
                        );
                      }
                    })
                  )}
                  <div ref={listContainerRef} />
                </List>
                <Divider />
                {/* Text box and send icon */}
                <Grid container style={{ padding: "20px" }}>
                  <Grid item xs={11}>
                    <TextField
                      label="Type Something"
                      fullWidth
                      required
                      id="chatBox"
                      name="chatBox"
                      value={currentMessage}
                      onChange={handleChatBoxChange}
                      onKeyPress={handleKeyPress}
                    ></TextField>
                  </Grid>
                  <Grid item xs={1} align="right">
                    <Fab color="primary" aria-label="add">
                      <SendIcon onClick={() => handleSendClick()} />
                    </Fab>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </Paper>
      </React.Fragment>
    </div>
  );
};

export default PatrolGroupChatComponent;
