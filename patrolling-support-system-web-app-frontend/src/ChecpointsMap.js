import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Button, Dialog, DialogActions, DialogContentText, DialogTitle, Divider, Paper } from "@mui/material";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { Box } from "@mui/material";
import { Loader } from "@googlemaps/js-api-loader";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  GeoPoint,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import styled from "@emotion/styled";

const loader = new Loader({
  apiKey: "AIzaSyBRx2VHwF6GZaONNSYekgsUTRZ6vrMN1FA",
});

const mapContainerStyle = {
  margin: 0,
  padding: 0,
  width: "100%",
  height: "630px",
};


const markerIcon = {
  path: "M-0.547 -10c-5.523 0-10 4.477-10 10 0 6.628 10 22 10 22s10-15.372 10-22c0-5.523-4.477-10-10-10zm1 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  fillColor: "green",
  fillOpacity: 0.9,
  strokeWeight: 0,
  rotation: 0,
  scale: 1
};

const DraggableContainer = styled.div`
  width: max;
  height: 50px;
  background-color: white;
  border: 1px solid #A9AC5D;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export function CheckpointsView({ documentData, setSignal }) {
  const [disabled, setDisabled] = useState(true);
  const [enabledMap, setEnabledMap] = useState(false);
  const [newMarker, setNewMarker] = useState(null);
  const { taskId } = useParams();
  const [safeToDelete, setSafeToDelete] = useState(false);

  const [newCheckpointName, setNewCheckpointName] = useState('');
  const handleNewCheckpointNameChange = (event) => {
    setNewCheckpointName(event.target.value)
  }

  var center = {
    lat: documentData.checkpoints[0] ? Number.parseFloat(documentData.checkpoints[0]._lat) : 50.06192492003556,
    lng: documentData.checkpoints[0] ? Number.parseFloat(documentData.checkpoints[0]._long) :  19.93918752197243
  }  

  const [checkpointToBeDeleted, setCheckpointToBeDeleted] = useState();

  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] = React.useState(false);
  const handleOpenConfirmDeleteDialog = (index) => {
    setCheckpointToBeDeleted(index)
    checkIfSafeToDeleteCheckpoint(index);
  };

  const handleCloseConfirmDeleteDialog = () => {
    setOpenConfirmDeleteDialog(false);
  };

  const handleConfirmDeleteClick = () => {
    var updatedList = [...documentData.checkpointNames];
    updatedList.splice(checkpointToBeDeleted, 1);
    changeCheckpointOrder(updatedList);
    handleCloseConfirmDeleteDialog();
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBRx2VHwF6GZaONNSYekgsUTRZ6vrMN1FA",
  });

  if (loadError) return "Error loading maps";
  if (!isLoaded) return "Loading maps";

  const disableMapAndSaveCheckpoint = async () => {
    setEnabledMap(false);

    const database = getFirestore();
    const docRef = doc(database, "Tasks", taskId);

    var updatedCheckpointNames;

    if (newCheckpointName === "") {
      updatedCheckpointNames = [...documentData.checkpointNames, `Checkpoint: ${documentData.checkpointNames.length+1}`];
    } else {
      updatedCheckpointNames = [...documentData.checkpointNames, newCheckpointName];
    }

    updateDoc(docRef, {
      checkpointNames: updatedCheckpointNames,
      checkpoints: arrayUnion(new GeoPoint(newMarker._lat, newMarker._long)),
    }).then(() => {
      console.log("Zmodyfikowano pomyślnie");
      setNewMarker(null);
      setSignal({});
      setNewCheckpointName("");
    });
  };



  const handleDrop = (droppedItem) => {
    if (!droppedItem.destination) {
      // The item was dragged outside the droppable area
      handleOpenConfirmDeleteDialog(droppedItem.source.index);
    } else if (
      droppedItem.source.droppableId === droppedItem.destination.droppableId &&
      droppedItem.source.index === droppedItem.destination.index
    ) {
      // The item was dropped in the same position, no change needed
      return;
    } else {
      // The item was dropped inside the droppable area, perform reorder
      var updatedList = [...documentData.checkpointNames];
      const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
      updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
      changeCheckpointOrder(updatedList);
    }
  };

  const checkIfSafeToDeleteCheckpoint = async (index) => {
    const database = getFirestore();
    const subtaskRef = collection(database, "CheckpointSubtasks");
    const subtaskQuery = query(subtaskRef, where("taskId", "==", taskId), where("checkpoint", "==", documentData.checkpoints[index]))
    const subtaskSnapshot = await getDocs(subtaskQuery);

    if (subtaskSnapshot.empty) {
      setSafeToDelete(true);
    } else {
      setSafeToDelete(false);
    }

    setOpenConfirmDeleteDialog(true);
  }


  const changeCheckpointOrder = async (updatedCheckpointList) => {
    const database = getFirestore();
    const taskRef = doc(database, "Tasks", taskId)

    // Swap checkpoint indexes according to user action
    const newCheckpointOrder = updatedCheckpointList.map((name) => {
      const index = documentData.checkpointNames.indexOf(name);
      return documentData.checkpoints[index];
    });

    await updateDoc(taskRef, {
      checkpointNames: updatedCheckpointList,
      checkpoints: newCheckpointOrder
    });

    setSignal({});
  }

  return (
    <React.Fragment>
      <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 }, position: 'relative', height: 750, }}>
        <Box display="flex" justifyContent="space-between" marginTop={"2vh"}>
          <Grid container spacing={0}>
            <Grid item xs={12} sm={12} container justifyContent={"center"}>
              <Typography variant="h5" gutterBottom>
                Add and manage checkpoints:
              </Typography>
            </Grid>
            <Dialog open={openConfirmDeleteDialog} onClose={handleCloseConfirmDeleteDialog}>
              <DialogTitle>
                Delete checkpoint
              </DialogTitle>
              {safeToDelete ? (
                <React.Fragment>
                  <DialogContentText style={{ minWidth: 100, minHeight: 100, marginLeft: '30px', marginRight: '30px' }}>
                    Are you sure you want to delete this checkpoint?
                  </DialogContentText>
                  <DialogActions>
                    <Button onClick={handleConfirmDeleteClick} variant="contained">
                      Confirm
                    </Button>
                    <Button onClick={handleCloseConfirmDeleteDialog}>
                      Cancel
                    </Button>
                  </DialogActions>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <DialogContentText style={{ minWidth: 100, minHeight: 100, marginLeft: '30px', marginRight: '30px' }}>
                    Cannot delete checkpoint with active subtasks. Delete existing subtasks and try again.
                  </DialogContentText>
                  <DialogActions>
                    <Button onClick={handleCloseConfirmDeleteDialog}>
                      Cancel
                    </Button>
                  </DialogActions>
                </React.Fragment>
              )}

            </Dialog>
            <Grid item xs={4} sm={4} lg={4}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 630,
                }}
              >
                <Grid item xs={12}>
                  <div>
                    <DragDropContext onDragEnd={handleDrop}>
                      <Droppable droppableId="list-container">
                        {(provided) => (
                          <div
                            className="list-container"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            style={{ height: "480px", overflowY: "scroll" }}
                          >
                            {documentData.checkpointNames.map((item, index) => (
                              <Draggable key={item} draggableId={item} index={index}>
                                {(provided) => (
                                  <DraggableContainer
                                    ref={provided.innerRef}
                                    {...provided.dragHandleProps}
                                    {...provided.draggableProps}
                                  >
                                    <p>{item}</p>
                                  </DraggableContainer>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </Grid>
                <Divider orientation="horizontal" />
                <Grid item xs={12}>
                  <TextField
                    label="Enter new checkpoint name"
                    fullWidth
                    rows={1}
                    variant="standard"
                    value={newCheckpointName}
                    onChange={handleNewCheckpointNameChange}
                  />
                </Grid>
                <Grid item xs={12} container justifyContent={"center"}>
                  <Button
                    variant="contained"
                    size="small"
                    style={{
                      marginTop: "20px",
                      marginLeft: "20px",
                    }}
                    onClick={() => setEnabledMap(true)}
                  >
                    Add
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    style={{
                      marginTop: "20px",
                      marginLeft: "20px",
                    }}
                    disabled={newMarker === null}
                    onClick={() => disableMapAndSaveCheckpoint()}
                  >
                    Save
                  </Button>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={8} sm={8} lg={8}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={15}
                center={center}
                onClick={(event) => {
                  if (enabledMap) {
                    setNewMarker({
                      _lat: parseFloat(event.latLng.lat().toFixed(6)),
                      _long: parseFloat(event.latLng.lng().toFixed(6)),
                    });
                  }
                }}
              >
                {/* // checkpoints on map*/}
                {documentData.checkpoints?.map((checkpoint, index) => {
                  var marker = (
                    <Marker
                      icon={markerIcon}
                      key={index}
                      position={{
                        lat: Number.parseFloat(checkpoint._lat),
                        lng: Number.parseFloat(checkpoint._long),
                      }}
                      opacity={0.9}
                      label={{ text: index.toString(),
                        fontSize: "15px",
                        fontWeight: "bold"}}
                    />
                  );
                  return marker;
                })}
                {/* // added checkpoint on map*/}
                {newMarker !== null ? (
                  <Marker
                    icon={markerIcon}
                    position={{
                      lat: newMarker._lat,
                      lng: newMarker._long,
                    }}
                    opacity={0.9}
                  />
                ) : null}
              </GoogleMap>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </React.Fragment>
  );
}
