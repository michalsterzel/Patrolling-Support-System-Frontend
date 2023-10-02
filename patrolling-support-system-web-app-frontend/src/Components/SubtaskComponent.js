import { useParams } from "react-router-dom";
import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import { auth } from "../firebase-config.js";
import { addDoc, collection, deleteDoc, doc, documentId, getDoc, getDocs, getFirestore, where } from "firebase/firestore";
import { query } from "firebase/database";
import { CheckBox } from "@mui/icons-material";
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getDownloadURL, getStorage, ref } from "firebase/storage";


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

export const SubtaskComponent = ({ documentData }) => {

  const { taskId } = useParams();
  const [isLoaded, setIsLoaded] = React.useState(false);

  const [selectedCheckpoint, setSelectedCheckpoint] = React.useState("");
  const [selectedCheckpointSubtasks, setSelectedCheckpointSubtasks] = React.useState([]);
  // const [parsedGeopoints, setParsedGeopoints] = React.useState([]);
  const [patrolParticipants, setPatrolParticipants] = React.useState([]);

  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const [openDeleteConfirm, setOpenDeleteConfirm] = React.useState(false);
  const [subtaskToBeDeleted, setSubtaskToBeDeleted] = React.useState("");

  // Opens the delete subtask dialog
  const handleDeleteConfirmClickOpen = (subtaskId) => {
    setSubtaskToBeDeleted(subtaskId);
    checkIfSubtaskContainsReport(subtaskId)
    setOpenDeleteConfirm(true);
  };

  // Closes the delete subtask dialog
  const handleDeleteConfirmClose = () => {
    setOpenDeleteConfirm(false);
  };

  // Handles the deletion of a subtask
  const handleSubtaskDeleteClick = () => {
    setOpenDeleteConfirm(false);
    deleteSubtaskFromFirestore();
    setIsLoaded(false)
    getSubtasksFromFirestore(selectedCheckboxIndex);
  }

  // Handles the add subtask button
  const handleAddSubtask = () => {
    addSubtaskToCheckpoint();
    setOpen(false);
    setSelectedParticipant('');
    setSubtaskName('');
    setSubtaskDescription('');
    setIsLoaded(false)
    getSubtasksFromFirestore(selectedCheckboxIndex);
  };

  // Open reports dialog

  const [openReportDialog, setOpenReportDialog] = React.useState(false);
  const [filesLoaded, setFilesLoaded] = React.useState(false);
  const [containsReport, setContainsReport] = React.useState(false);
  const [selectedSubtaskReports, setSelectedSubtaskReports] = React.useState([]);
  const [selectedImage, setSelectedImage] = React.useState("");
  const [selectedAudio, setSelectedAudio] = React.useState("");
  const [checkpointsExits, setCheckpointsExist] = React.useState(false);

  const handleOpenSubtaskReports = (subtaskId) => {
    checkIfSubtaskContainsReport(subtaskId);
    getSubtaskReportDataFromFirestore(subtaskId);
    setOpenReportDialog(true);
  };

  const handleCloseSubtaskReports = () => {
    setOpenReportDialog(false);
    setFilesLoaded(false);
    setSelectedImage("");
  };

  const handleImageSelectionChange = () => {
    setSelectedImage("");
  };

  const handleAudioSelectionChange = () => {
    setSelectedAudio("");
  };

  const handleImageFileClick = (index) => {
    getFileFromFirebaseStorage(index, "image")
  }

  const handleAudioFileClick = (index) => {
    getFileFromFirebaseStorage(index, "audio")
  }

  // -----------------------------------------------------

  const [subtaskName, setSubtaskName] = React.useState("");
  const handleSubtaskNameChange = (event) => {
    setSubtaskName(event.target.value);
  };

  const [subtaskDescription, setSubtaskDescription] = React.useState("");
  const handleSubtaskDescriptionChange = (event) => {
    setSubtaskDescription(event.target.value);
  };


  const [selectedParticipant, setSelectedParticipant] = React.useState("");
  const handleParticipantChange = (event) => {
    setSelectedParticipant(event.target.value);
  };

  const [selectedCheckboxIndex, setSelectedCheckboxIndex] = React.useState();

  const handleCheckpointSelectionChange = (event) => {
    setSelectedCheckpoint(event.target.value)
    // const checkpointArray = Object.values(parsedGeopoints);
    // const checkpointIndex = checkpointArray.indexOf(event.target.value);

    const checkpointIndex = documentData.checkpointNames.indexOf(event.target.value);

    setSelectedCheckboxIndex(checkpointIndex);
    getSubtasksFromFirestore(checkpointIndex);
  };

  const getFileFromFirebaseStorage = async (index, fileType) => {
    const storage = getStorage();
    let spaceRef;

    if (fileType === "image") {
      spaceRef = ref(storage, selectedSubtaskReports.images[index]);
      getDownloadURL(spaceRef)
        .then((url) => {
          window.open(url, '_blank')
        }).catch((error) => {
          console.log("Error downloading image", error);
        })
    } else if (fileType === "audio") {
      spaceRef = ref(storage, selectedSubtaskReports.recordings[index]);
      getDownloadURL(spaceRef)
        .then((url) => {
          const audioWindow = window.open('', '_blank');
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
        })
    }
  }

  const addSubtaskToCheckpoint = async () => {
    if (auth.currentUser) {
      const checkpointIndex = documentData.checkpointNames.indexOf(selectedCheckpoint);
      const checkpoint = documentData.checkpoints[checkpointIndex];

      const database = getFirestore();
      const collectionRef = collection(database, 'CheckpointSubtasks');
      const docRef = await addDoc(collectionRef, {
        taskId: taskId,
        subtaskName: subtaskName,
        description: subtaskDescription,
        checkpoint: checkpoint,
        patrolParticipantId: selectedParticipant
      })
      // console.log("Added new document with ID: ", docRef.id);
    }
  };

  const getSubtaskReportDataFromFirestore = async (subtaskId) => {
    const database = getFirestore();
    const reportRef = collection(database, "Reports");
    const reportQuery = query(reportRef, where("subtaskId", "==", subtaskId));
    const reportSnapshot = await getDocs(reportQuery);

    const dataArray = reportSnapshot.docs.map((doc) => doc.data());

    if (!dataArray.empty && containsReport === true) {
      const subtaskReportData = dataArray[0];

      const updatedsubtaskReportData = {
        ...subtaskReportData,
        imageFileNames: subtaskReportData.images.map((path) => {
          const pathSegments = path.split('/');
          const fileName = pathSegments[pathSegments.length - 1];
          return fileName;
        }),
        recordingFileNames: subtaskReportData.recordings.map((path) => {
          const pathSegments = path.split('/');
          const fileName = pathSegments[pathSegments.length - 1];
          return fileName;
        }),
      }

      // console.log(updatedsubtaskReportData);
      setSelectedSubtaskReports(updatedsubtaskReportData);
      setFilesLoaded(true);
    } else {
      console.log("No reports for this subtask");
    }
  }

  const checkIfSubtaskContainsReport = async (subtaskId) => {
    const database = getFirestore();
    const reportRef = collection(database, "Reports");
    const reportQuery = query(reportRef, where("subtaskId", "==", subtaskId));
    const reportSnapshot = await getDocs(reportQuery);

    if (!reportSnapshot.empty) {
      setContainsReport(true);
    } else {
      setContainsReport(false);
    }
  }

  const deleteSubtaskFromFirestore = async () => {
    try {
      const database = getFirestore();
      const subTaskRef = doc(database, "CheckpointSubtasks", subtaskToBeDeleted);
      await deleteDoc(subTaskRef);
    } catch (error) {
      console.log("Error deleting document: ", error);
    }
  }

  const getParticipantNamesFromFirestore = async (subtaskList) => {
    const database = getFirestore();
    const participantRef = collection(database, "Users")
    const participantQuery = query(participantRef, where(documentId(), "in", documentData.patrolParticipants))
    const paritcipantSnapshot = await getDocs(participantQuery);
    const participantList = [];

    paritcipantSnapshot.forEach((doc) => {
      const data = doc.data();
      const participant = {
        userId: data.userId,
        name: data.name,
        surname: data.surname
      };
      participantList.push(participant);
    });

    setPatrolParticipants(participantList)

    const subtaskListWithNames = subtaskList.map((item) => {
      const user = participantList.find((user) => user.userId === item.patrolParticipantId)
      const updatedsubtaskList = { ...item, participantName: user.name + " " + user.surname }
      return updatedsubtaskList
    })

    setSelectedCheckpointSubtasks(subtaskListWithNames);
    setIsLoaded(true);
  }

  const getSubtasksFromFirestore = async (index) => {
    const database = getFirestore();
    const subtaskRef = collection(database, "CheckpointSubtasks")
    const subtaskQuery = query(subtaskRef, where("taskId", "==", taskId), where("checkpoint", "==", documentData.checkpoints[index]))
    const subtaskSnapshot = await getDocs(subtaskQuery);
    const subtaskList = [];

    subtaskSnapshot.forEach((doc) => {
      const data = doc.data();
      const subtask = {
        id: doc.id,
        subtaskName: data.subtaskName,
        description: data.description,
        patrolParticipantId: data.patrolParticipantId
      };
      subtaskList.push(subtask);
    });

    // appendParticipantNameFromFirestore(subtaskList);

    getParticipantNamesFromFirestore(subtaskList);
  }

  // Tu do sprawdzenia co się dzieje jak checkpointy ulegną zmianie
  // ------------------------------------------------------------------------------------------------------

  // React.useEffect(() => {
  //   if (documentData.hasOwnProperty("checkpoints") && documentData.checkpoints.length > 0) {
  //     setParsedGeopoints(documentData.checkpoints.map((point) => `${point._lat}, ${point._long}`));
  //     setCheckpointsExist(true);
  //   }
  // }, [documentData.checkpoints]);

  React.useEffect(() => {
    if (documentData.hasOwnProperty("checkpoints")) {
      if (documentData.checkpoints[0] !== null) {
        setSelectedCheckpoint(documentData.checkpointNames[0]);
        setSelectedCheckboxIndex(0);
        getSubtasksFromFirestore(0);
        setCheckpointsExist(true);
      }
    }
  }, [documentData.checkpointNames])


  // console.log(parsedGeopoints);
  // ------------------------------------------------------------------------------------------------------

  return (
    <React.Fragment>
      <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 }, position: 'relative', height: 750, }}>
        <Grid container spacing={2}>
          {checkpointsExits ? (
            <React.Fragment>
              <Grid item xs={12} sm={12} container justifyContent={"center"}>
                <Typography variant="h5">
                  Choose checkpoint to view assigned subtasks:
                </Typography>
              </Grid>
              <Grid item xs={12} sm={2} sx={{ position: 'absolute', top: 0, right: 0 }}>
                <Button
                  variant='contained'
                  size='large'
                  style={{ marginRight: '35px' }}
                  onClick={() => handleClickOpen()}
                >
                  Add subtask
                </Button>
                <Dialog open={open} onClose={handleClose} fullWidth>
                  <DialogTitle>
                    Add subtask to current checkpoint:
                  </DialogTitle>
                  <DialogContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Subtask name..."
                          fullWidth
                          variant="outlined"
                          value={subtaskName}
                          onChange={handleSubtaskNameChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Subtask description..."
                          fullWidth
                          variant="outlined"
                          multiline
                          rows={3}
                          value={subtaskDescription}
                          onChange={handleSubtaskDescriptionChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <InputLabel id="participant-label" shrink={selectedParticipant !== ''}>
                          Choose subtask participant:
                        </InputLabel>
                        <Select
                          value={selectedParticipant}
                          onChange={handleParticipantChange}
                          fullWidth
                        >
                          {patrolParticipants.map((item, index) => (
                            <MenuItem key={index} value={item.userId}>
                              {item.name} {item.surname}
                            </MenuItem>
                          ))}
                        </Select>
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleAddSubtask} variant='contained'>
                      Add subtask
                    </Button>
                    <Button onClick={handleClose}>
                      Cancel
                    </Button>
                  </DialogActions>
                </Dialog>
                <Dialog open={openDeleteConfirm} onClose={handleDeleteConfirmClose}>
                  {containsReport ? (
                    <React.Fragment>
                      <DialogTitle style={{ marginLeft: '30px', marginRight: '30px' }}>
                        Cannot delete subtask with assigned report or file
                      </DialogTitle>
                      <DialogActions>
                        <Button onClick={handleDeleteConfirmClose}>
                          Cancel
                        </Button>
                      </DialogActions>
                    </React.Fragment>

                  ) : (
                    <React.Fragment>
                      <DialogTitle>
                        Are you sure you want to delete this subtask?
                      </DialogTitle>
                      <DialogActions>
                        <Button onClick={handleSubtaskDeleteClick} variant="contained">
                          Confirm
                        </Button>
                        <Button onClick={handleDeleteConfirmClose}>
                          Cancel
                        </Button>
                      </DialogActions>
                    </React.Fragment>
                  )}
                </Dialog>
                {/* Dialog który obsługuje otwieranie raportów dla danego subtaska */}
                <Dialog open={openReportDialog} onClose={handleCloseSubtaskReports}>
                  <DialogTitle>
                    Reports assgined to this subtask:
                  </DialogTitle>
                  <DialogContent style={{ minWidth: 600, minHeight: 350 }}>
                    {containsReport ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <InputLabel>
                            Subtask report note:
                          </InputLabel>
                          <TextField
                            variant='outlined'
                            margin="normal"
                            fullWidth
                            multiline
                            rows={2}
                            value={selectedSubtaskReports.note}
                            disabled
                            sx={{
                              "& .MuiInputBase-input.Mui-disabled": {
                                WebkitTextFillColor: "#000000",
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <InputLabel>
                            Subtask images:
                          </InputLabel>
                          {filesLoaded ? (
                            <Select
                              value={selectedImage}
                              onChange={handleImageSelectionChange}
                              fullWidth
                            >
                              {selectedSubtaskReports.imageFileNames.map((item, index) => (
                                <MenuItem key={index} value={item} onClick={() => handleImageFileClick(index)}>
                                  {item}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Typography>
                              Loading...
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12}>
                          <InputLabel>
                            Subtask audio recordings:
                          </InputLabel>
                          {filesLoaded ? (
                            <Select
                              value={selectedAudio}
                              onChange={handleAudioSelectionChange}
                              fullWidth
                            >
                              {selectedSubtaskReports.recordingFileNames.map((item, index) => (
                                <MenuItem key={index} value={item} onClick={() => handleAudioFileClick(index)}>
                                  {item}
                                </MenuItem>
                              ))}
                            </Select>
                          ) : (
                            <Typography>
                              Loading...
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    ) : (
                      <Grid>
                        <Typography>
                          This subtask contains no report as of now
                        </Typography>
                      </Grid>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseSubtaskReports}>
                      Cancel
                    </Button>
                  </DialogActions>
                </Dialog>
              </Grid>
              {isLoaded ? (
                <React.Fragment>
                  <Grid item xs={12} sm={12} container justifyContent={"center"}>
                    <Select
                      value={selectedCheckpoint}
                      onChange={handleCheckpointSelectionChange}
                      style={{ width: '500px', textAlign: 'center' }}
                    >
                      {/* Przerobić na checkpointNames */}
                      {documentData.checkpointNames.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <Divider orientation='horizontal' />
                    {selectedCheckpointSubtasks.length > 0 ? (
                      <div style={{ height: "550px", overflowY: "scroll" }}>
                        <List>
                          {selectedCheckpointSubtasks.map((item, index) => (
                            <React.Fragment key={index}>
                              <ListItem >
                                <ListItemText>
                                  <Typography variant="h6" noWrap>Subtask: {item.subtaskName}</Typography>
                                  <Typography variant="body1" noWrap>Paritcipant: {item.participantName}</Typography>
                                  <Typography variant="body2" noWrap>Description: {item.description}</Typography>
                                </ListItemText>
                                <IconButton onClick={() => handleOpenSubtaskReports(item.id)}>
                                  <ArrowDropDownIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDeleteConfirmClickOpen(item.id)}>
                                  <DeleteIcon />
                                </IconButton>
                              </ListItem>
                              <Divider orientation='horizontal' />
                            </React.Fragment>
                          ))}
                        </List>
                      </div>
                    ) : (
                      <React.Fragment>
                        <Grid container justifyContent={"center"}>
                          <Typography variant="h5">
                            No subtasks declared for this checkpoint
                          </Typography>
                        </Grid>
                      </React.Fragment>
                    )}
                  </Grid>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Grid container justifyContent={"center"}>
                    <Typography>
                      Loading...
                    </Typography>
                  </Grid>
                </React.Fragment>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Grid item xs={12} sm={12} container justifyContent={"center"}>
                <Typography variant="h5">
                  No checkpoints declared yet. Declare a checkpoint to add and manage subtasks
                </Typography>
              </Grid>
            </React.Fragment>
          )}
        </Grid>
      </Paper>
    </React.Fragment>
  );
}
