import { useParams } from "react-router-dom";
import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import { auth } from "../firebase-config.js";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  collection,
  documentId,
  getDocs,
  getFirestore,
  where,
} from "firebase/firestore";
import { query } from "firebase/database";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { Loader } from "@googlemaps/js-api-loader";

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

let url = "http://maps.google.com/mapfiles/ms/icons/green.png";

export const PatrolParticipantReportComponent = ({ documentData }) => {
  const { taskId } = useParams();
  const [isLoaded, setIsLoaded] = React.useState(false);

  const [reportList, setReportList] = React.useState([]);

  const [selectedReport, setSelectedReport] = React.useState([]);

  const [selectedReportLocalization, setSelectedReportLocalization] =
    React.useState(null);

  // Icon button handlers
  const handleOpenReportDetails = (report) => {
    getFileNamesForImagesAndAudioFiles(report);
  };

  const handleOpenLocalization = (location) => {
    // console.log("This is the base location: ", location);
    setSelectedReportLocalization(location);
  };
  // ------------------------------------------------------------

  // Report details dialog handlers

  const [selectedImage, setSelectedImage] = React.useState("");

  const [selectedAudio, setSelectedAudio] = React.useState("");

  const [containsAudio, setContainsAudio] = React.useState(false);

  const [containsImages, setContainsImages] = React.useState(false);

  const [openReportDetails, setOpenReportDetails] = React.useState(false);
  const handleClickOpenReportDetails = () => {
    setOpenReportDetails(true);
  };

  const handleCloseReportDetails = () => {
    setContainsAudio(false);
    setContainsImages(false);
    setOpenReportDetails(false);
  };

  const handleImageSelectionChange = () => {
    setSelectedImage("");
  };

  const handleAudioSelectionChange = () => {
    setSelectedAudio("");
  };

  const handleImageFileClick = (index) => {
    getFileFromFirebaseStorage(index, "image");
  };

  const handleAudioFileClick = (index) => {
    getFileFromFirebaseStorage(index, "audio");
  };
  // ---------------------------------------------------------------

  // Location dialog handlers
  const [openLocalization, setOpenLocalization] = React.useState(false);
  const handleClickOpenLocalization = () => {
    setCheckpointLoaded(true);
    setOpenLocalization(true);
  };

  const handleCloseLocalization = () => {
    setOpenLocalization(false);
  };

  const [checkpointLoaded, setCheckpointLoaded] = React.useState(false);
  // ---------------------------------------------------------------

  const getParticipantNamesFromFirestore = async (reportData) => {
    const database = getFirestore();
    const participantRef = collection(database, "Users");
    const participantQuery = query(
      participantRef,
      where(documentId(), "in", documentData.patrolParticipants)
    );
    const paritcipantSnapshot = await getDocs(participantQuery);
    const participantList = [];

    paritcipantSnapshot.forEach((doc) => {
      const data = doc.data();
      const participant = {
        userId: data.userId,
        name: data.name,
        surname: data.surname,
      };
      participantList.push(participant);
    });

    const reportListWithNames = reportData.map((item) => {
      const user = participantList.find(
        (user) => user.userId === item.patrolParticipantId
      );
      const updatedReportList = {
        ...item,
        participantName: user.name + " " + user.surname,
      };
      return updatedReportList;
    });

    setReportList(reportListWithNames);
    setIsLoaded(true);
  };

  const getReportsFromFirestore = async () => {
    const database = getFirestore();
    const reportRef = collection(database, "Reports");
    const reportQuery = query(
      reportRef,
      where("taskId", "==", taskId),
      where("subtaskId", "==", null)
    );
    const reportSnapshot = await getDocs(reportQuery);
    const reportData = [];
    reportSnapshot.forEach((doc) => {
      reportData.push(doc.data());
    });

    getParticipantNamesFromFirestore(reportData);
  };

  const getFileNamesForImagesAndAudioFiles = async (report) => {
    var reportWithNames = report;

    if (reportWithNames.images.length > 0) {
      const reportImageFileNames = {
        ...reportWithNames,
        imageFileNames: report.images.map((path) => {
          const pathSegments = path.split("/");
          const fileName = pathSegments[pathSegments.length - 1];
          return fileName;
        }),
      };
      reportWithNames = reportImageFileNames;
      setContainsImages(true);
    }

    if (reportWithNames.recordings.length > 0) {
      const reportRecordingFileNames = {
        ...reportWithNames,
        recordingFileNames: report.recordings.map((path) => {
          const pathSegments = path.split("/");
          const fileName = pathSegments[pathSegments.length - 1];
          return fileName;
        }),
      };
      reportWithNames = reportRecordingFileNames;
      setContainsAudio(true);
    }

    setSelectedReport(reportWithNames);
    handleClickOpenReportDetails();
  };

  const getFileFromFirebaseStorage = async (index, fileType) => {
    const storage = getStorage();
    let spaceRef;

    if (fileType === "image") {
      spaceRef = ref(storage, selectedReport.images[index]);
      getDownloadURL(spaceRef)
        .then((url) => {
          window.open(url, "_blank");
        })
        .catch((error) => {
          console.log("Error downloading image", error);
        });
    } else if (fileType === "audio") {
      spaceRef = ref(storage, selectedReport.recordings[index]);
      getDownloadURL(spaceRef)
        .then((url) => {
          const audioWindow = window.open("", "_blank");
          audioWindow.document.write(`
        <html>
          <head>
            <title>Audio Player</title>
          </head>
          <body>
            <audio controls autoplay>
              <source src="${url}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
          </body>
        </html>
      `);
        })
        .catch((error) => {
          console.log("Error downloading audio:", error);
        });
    }
  };

  const { isMapLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBRx2VHwF6GZaONNSYekgsUTRZ6vrMN1FA",
  });

  if (loadError) console.log("Error loading maps");
  // if (!isMapLoaded) console.log("Loading maps");

  React.useEffect(() => {
    getReportsFromFirestore();
  }, []);

  React.useEffect(() => {
    if (selectedReportLocalization !== null) {
      handleClickOpenLocalization();
    }
  }, [selectedReportLocalization]);

  return (
    <React.Fragment>
      <Paper
        variant="outlined"
        sx={{
          my: { xs: 3, md: 6 },
          p: { xs: 2, md: 3 },
          position: "relative",
          height: 750,
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} container justifyContent={"center"}>
            <Typography variant="h5">Patrol group member reports:</Typography>
          </Grid>
          <Dialog
            open={openReportDetails}
            onClose={handleCloseReportDetails}
            fullWidth
          >
            <DialogTitle>Report details:</DialogTitle>
            <DialogContent style={{ minWidth: 600, minHeight: 350 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <InputLabel>Subtask report note:</InputLabel>
                  <TextField
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    multiline
                    rows={2}
                    value={selectedReport.note}
                    disabled
                    sx={{
                      "& .MuiInputBase-input.Mui-disabled": {
                        WebkitTextFillColor: "#000000",
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Images attached to report:</InputLabel>
                  {containsImages ? (
                    <Select
                      value={selectedImage}
                      onChange={handleImageSelectionChange}
                      fullWidth
                    >
                      {selectedReport.imageFileNames.map((item, index) => (
                        <MenuItem
                          key={index}
                          value={item}
                          onClick={() => handleImageFileClick(index)}
                        >
                          {item}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <Typography>No image files attached to report.</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <InputLabel>Audio files attached to report:</InputLabel>
                  {containsAudio ? (
                    <Select
                      value={selectedAudio}
                      onChange={handleAudioSelectionChange}
                      fullWidth
                    >
                      {selectedReport.recordingFileNames.map((item, index) => (
                        <MenuItem
                          key={index}
                          value={item}
                          onClick={() => handleAudioFileClick(index)}
                        >
                          {item}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <Typography>No audio files attached to report.</Typography>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseReportDetails}>Cancel</Button>
            </DialogActions>
          </Dialog>
          {/* Localization Dialog */}
          <Dialog
            open={openLocalization}
            onClose={handleCloseLocalization}
            fullWidth
          >
            <DialogTitle>Report location:</DialogTitle>
            <DialogContent>
              {checkpointLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  zoom={15}
                  center={{
                    lat: Number.parseFloat(selectedReportLocalization._lat),
                    lng: Number.parseFloat(selectedReportLocalization._long),
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
                  // report marker
                  <Marker
                    icon={markerIconRed}
                    position={{
                      lat: Number.parseFloat(selectedReportLocalization._lat),
                      lng: Number.parseFloat(selectedReportLocalization._long),
                    }}
                    label={{ text: "●", fontSize: "23px", fontWeight: "bold" }}
                  />
                </GoogleMap>
              ) : null}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseLocalization}>Cancel</Button>
            </DialogActions>
          </Dialog>
          {isLoaded ? (
            <React.Fragment>
              <Grid item xs={12} sm={12}>
                <Divider orientation="horizontal" />
                <div style={{ height: "550px", overflowY: "scroll" }}>
                  <List>
                    {reportList.map((item, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText>
                            <Typography variant="h6" noWrap>
                              Participant: {item.participantName}
                            </Typography>
                            {item.images.length > 0 ? (
                              <Typography variant="body1" noWrap>
                                Images: {item.images.length}
                              </Typography>
                            ) : (
                              <Typography variant="body1" noWrap>
                                No images
                              </Typography>
                            )}
                            {item.recordings.length > 0 ? (
                              <Typography variant="body1" noWrap>
                                Audio files: {item.recordings.length}
                              </Typography>
                            ) : (
                              <Typography variant="body1" noWrap>
                                No audio files
                              </Typography>
                            )}
                          </ListItemText>
                          <IconButton
                            onClick={() => handleOpenReportDetails(item)}
                          >
                            <ArrowDropDownIcon />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              handleOpenLocalization(item.location)
                            }
                          >
                            <LocationOnIcon />
                          </IconButton>
                        </ListItem>
                        <Divider orientation="horizontal" />
                      </React.Fragment>
                    ))}
                  </List>
                </div>
              </Grid>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Grid item xs={12} sm={12} container justifyContent={"center"}>
                <Typography>Loading...</Typography>
              </Grid>
            </React.Fragment>
          )}
        </Grid>
      </Paper>
    </React.Fragment>
  );
};
