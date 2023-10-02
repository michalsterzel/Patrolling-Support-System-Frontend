import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { collection, doc, documentId, getDoc, getDocs, getFirestore, query, where } from 'firebase/firestore'
import { auth } from "../firebase-config.js";
import moment from 'moment';
import { Button, Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';


const TaskDetailsComponent = ({ documentData }) => {

  const { taskId } = useParams();

  const [isLoaded, setIsLoaded] = React.useState(false);

  const [participantList, setParticipantList] = useState([]);
  const [coordinator, setCoordinator] = useState([]);
  const getNamesFromFirestore = async (selectedParticipants) => {
    if (auth.currentUser) {
      const database = getFirestore();
      const collectionRef = collection(database, 'Users');
      const documentQuery = query(collectionRef, where(documentId(), 'in', selectedParticipants));
      const querySnapshot = await getDocs(documentQuery)
      const participantsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const participant = {
          id: doc.id,
          name: data.name,
          surname: data.surname
        };
        participantsData.push(participant);
      });
      setParticipantList(participantsData);


      const coordinatorRef = doc(database, 'Coordinators', documentData.coordinator);
      const coordinatorSnapshot = await getDoc(coordinatorRef)
      setCoordinator(coordinatorSnapshot.data());

      setIsLoaded(true);
    }
  }

  React.useEffect(() => {
    getNamesFromFirestore(documentData.patrolParticipants);
  }, []);

  const navigate = useNavigate();

  const handleEditTaskClick = () => {
    navigate(`/editTask/${taskId}`);
  }

  return (
    <React.Fragment>
      <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 }, position: 'relative' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={10}>
            <Typography variant="h6" gutterBottom>
              Task name:
            </Typography>
            <TextField
              variant='outlined'
              margin="normal"
              fullWidth
              multiline
              rows={1}
              value={documentData.name}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#000000",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2} sx={{ position: 'absolute', top: 0, right: 0 }}>
            <Button
              variant='contained'
              size='large'
              style={{ marginRight: '35px' }}
              onClick={() => handleEditTaskClick()}
            >
              Edit task
            </Button>
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="h6" gutterBottom>
              Location name:
            </Typography>
            <TextField
              variant='outlined'
              margin="normal"
              fullWidth
              multiline
              rows={1}
              value={documentData.location}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#000000",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="h6" gutterBottom>
              Task Coordinator:
            </Typography>
            {isLoaded ? (
              <TextField
                variant='outlined'
                margin="normal"
                fullWidth
                multiline
                rows={1}
                value={coordinator.name + ' ' + coordinator.surname}
                disabled
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#000000",
                  },
                }}
              />
            ) : (
              <TextField
                variant='outlined'
                margin="normal"
                fullWidth
                multiline
                rows={2}
                value={"Loading ..."}
                disabled
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#000000",
                  },
                }}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="h6" gutterBottom>
              Task Participants:
            </Typography>
            {isLoaded ? (
              <TextField
                variant='outlined'
                margin="normal"
                fullWidth
                multiline
                rows={2}
                value={participantList.map(participant => participant.name + ' ' + participant.surname).join(', ')}
                disabled
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#000000",
                  },
                }}
              />
            ) : (
              <TextField
                variant='outlined'
                margin="normal"
                fullWidth
                multiline
                rows={2}
                value={"Loading ..."}
                disabled
                sx={{
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#000000",
                  },
                }}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="h6" gutterBottom>
              Task start date:
            </Typography>
            <TextField
              variant='outlined'
              margin="normal"
              rows={1}
              value={moment(documentData.startDate.toDate()).format('DD/MM/YYYY HH:mm')}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#000000",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={10} >
            <Typography variant="h6" gutterBottom>
              Task end date:
            </Typography>
            <TextField
              variant='outlined'
              margin="normal"
              rows={1}
              value={moment(documentData.endDate.toDate()).format('DD/MM/YYYY HH:mm')}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#000000",
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="h6" gutterBottom>
              Task description:
            </Typography>
            <TextField
              variant='outlined'
              margin="normal"
              fullWidth
              multiline
              rows={4}
              value={documentData.taskDescription}
              disabled
              sx={{
                "& .MuiInputBase-input.Mui-disabled": {
                  WebkitTextFillColor: "#000000",
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>
    </React.Fragment>
  );
};

export default TaskDetailsComponent;