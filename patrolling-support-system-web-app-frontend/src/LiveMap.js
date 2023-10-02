import { Loader } from "@googlemaps/js-api-loader";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";
import * as React from "react";
import { auth } from "./firebase-config.js";
import {
  collection,
  getDocs,
  getFirestore,
  GeoPoint,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { Paper, Typography, Grid } from "@mui/material";
import { useParams } from "react-router-dom";
import { query } from "firebase/database";
import PatrolGroupChatComponent from "./Components/PatrolGroupChatComponent.js";
import { useNavigate } from "react-router-dom";

const loader = new Loader({
  apiKey: "AIzaSyBRx2VHwF6GZaONNSYekgsUTRZ6vrMN1FA",
});

const mapContainerStyle = {
  top: "5vh",
  margin: 0,
  padding: 0,
  width: "100%",
  height: "605px",
};



const seededRandom = (input) => Math.sin((input + 1) / Math.PI);

const randomColor = (index) =>
  "hsl(" + Math.floor(seededRandom(index) * 0xff) + ", 50%, 50%)";

export function MapView({ documentData, setChatParticipant }) {
  // load routes data from firebase
  const [patrolRouteData, setPatrolRouteData] = React.useState(new Map());
  const [patrolMembers, setPatrolMembers] = React.useState(new Map());
  const [checkpintsNames, setCheckpintsNames] = React.useState([]);
  const [checkpintsSubtasks, setCheckpintsSubtasks] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(null);
  const [selectedSubtaskName, setSelectedSubtaskName] = React.useState(null);
  const { taskId } = useParams();

  // const handlePatropParticipantClick = (patrolParticipantId) => {
  //   setChatParticipant(patrolParticipantId);
  // };
  var center = {
    lat: documentData.checkpoints[0] ? Number.parseFloat(documentData.checkpoints[0]._lat) : 50.06192492003556,
    lng: documentData.checkpoints[0] ? Number.parseFloat(documentData.checkpoints[0]._long) :  19.93918752197243
  } 

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const getCheckpointsNames = async () => {
    if (auth.currentUser) {
      const database = getFirestore();
      const docRef = doc(database, "Tasks", `${taskId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        var map = [];
        docSnap.data().checkpointNames.forEach((name) => {
          map.push(name);
        });
        setCheckpintsNames(map);
      } else {
        console.log("No such document!");
      }
    }
  };

  const getCheckpointsSubtasks = async () => {
    if (auth.currentUser) {
      const database = getFirestore();
      const docRef = collection(database, "CheckpointSubtasks");
      const docSnap = await getDocs(docRef);

      if (docSnap) {
        var map = [];

        docSnap.forEach((doc) => {
          if (doc.data().taskId == taskId) {
            const d = {
              point: new GeoPoint(
                Number.parseFloat(doc.data().checkpoint._lat),
                Number.parseFloat(doc.data().checkpoint._long)
              ),
              name: doc.data().subtaskName,
            };
            map.push(d);
          }
        });
        setCheckpintsSubtasks(map);
      } else {
        console.log("No such document!");
      }
    }
  };

  const setSubtaskName = async (checkpoint) => {
    var str = [];

    checkpintsSubtasks?.map((subtask) => {
      if (
        subtask.point._lat == checkpoint._lat &&
        subtask.point._long == checkpoint._long
      ) {
        str.push(subtask.name);
      }
    });
    setSelectedSubtaskName(str);
  };

  const getPatrolRouteDetails = async () => {
    if (auth.currentUser) {
      const database = getFirestore();
      const docRef = collection(database, "RoutePoint");

      const docQuery = query(docRef, where("taskId", "==", taskId));

      const unsubscribe = onSnapshot(docQuery, (querySnapshot) => {
        if (querySnapshot) {
          var map = new Map();
          querySnapshot.forEach((doc) => {
            if (map.get(doc.data().patrolParticipantId)) {
              map.set(doc.data().patrolParticipantId, [
                doc.data(),
                ...map.get(doc.data().patrolParticipantId),
              ]);
            } else {
              map.set(doc.data().patrolParticipantId, [doc.data()]);
            }
          });

          setPatrolRouteData(map);
        } else {
          console.log("No such document!");
        }
      });
    }
  };

  const getPatrolMembersDetails = async () => {
    if (auth.currentUser) {
      const database = getFirestore();
      const docRef = collection(database, "Users");
      const docSnap = await getDocs(docRef);

      if (docSnap) {
        var map = new Map();
        docSnap.forEach((doc) => {
          if (documentData.patrolParticipants.includes(doc.data().userId)) {
            map.set(
              doc.data().userId,
              doc.data().name + "\n" + doc.data().surname
            );
          }
        });
        setPatrolMembers(map);
      } else {
        console.log("No such document!");
      }
    }
  };

  React.useEffect(() => {
    getCheckpointsNames();
    getCheckpointsSubtasks();
    getPatrolRouteDetails();
    getPatrolMembersDetails();
  }, []);

  // load map
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyBRx2VHwF6GZaONNSYekgsUTRZ6vrMN1FA",
  });

  if (loadError) return "Error loading maps";
  if (!isLoaded) return "Loading maps";

  return (
    <div>
      <Paper
        variant="outlined"
        sx={{
          my: { xs: 3, md: 6 },
          p: { xs: 2, md: 3 },
          position: "relative",
          height: 750,
        }}
      >
        <Typography sx={{ textAlign: "center", fontSize: "2rem" }}>
          {documentData.name}
        </Typography>
        <Grid item xs={12}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={15}
            center={center}
            onLoad={onMapLoad}
          >
            // adding checkpoints to map
            {documentData.checkpoints?.map((checkpoint, index) => {
              const lat = Number.parseFloat(checkpoint._lat);
              const long = Number.parseFloat(checkpoint._long);
              const markerIcon = {
                path: "M-0.547 -10c-5.523 0-10 4.477-10 10 0 6.628 10 22 10 22s10-15.372 10-22c0-5.523-4.477-10-10-10zm1 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
                fillColor: "green",
                fillOpacity: 0.9,
                strokeWeight: 0,
                rotation: 0,
                scale: 1,
              };
              var marker = (
                <Marker
                  icon={markerIcon}
                  key={index}
                  position={{
                    lat: lat,
                    lng: long,
                  }}
                  opacity={0.9}
                  onClick={() => {
                    setSelected(checkpoint);
                    setSelectedIndex(index);
                    setSubtaskName(checkpoint);
                  }}
                  label={{
                    text: (index + 1).toString(),
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                />
              );
              return marker;
            })}
            // adding info windows to checkpoints
            {selected ? (
              <InfoWindow
                position={{ lat: selected._lat, lng: selected._long }}
                onCloseClick={() => {
                  setSelected(null);
                }}
              >
                <div>
                  <p>
                    <b>
                      {selectedIndex +
                        1 +
                        ". " +
                        checkpintsNames.at(selectedIndex)}
                    </b>
                  </p>
                  {selectedSubtaskName.map((name) => {
                    return <p>{name}</p>;
                  })}
                </div>
              </InfoWindow>
            ) : null}
            // adding routes
            {Array.from(patrolRouteData).map(([_, patrolRoute]) => (
              <Polyline
                path={patrolRoute
                  .sort((a, b) => a.date.seconds - b.date.seconds)
                  .map(
                    (route) =>
                      new window.google.maps.LatLng(
                        route.location._lat,
                        route.location._long
                      )
                  )}
                options={{ strokeColor: randomColor(patrolRoute.length) }}
              />
            ))}
            // adding route info
            {Array.from(patrolRouteData).map(([_, patrolRoute]) => {
              var index = patrolRoute.length - 1;
              return (
                <Marker
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: randomColor(patrolRoute.length),
                    fillOpacity: 0.5,
                    scale: 10,
                    strokeColor: randomColor(patrolRoute.length),
                    strokeWeight: 0.7,
                  }}
                  position={{
                    lat: patrolRoute[index].location._lat,
                    lng: patrolRoute[index].location._long,
                  }}
                  label={{
                    text: patrolMembers.get(
                      patrolRoute[index].patrolParticipantId
                    ),
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                  onClick={() =>
                    setChatParticipant(patrolRoute[index].patrolParticipantId)
                  }
                />
              );
            })}
            // adding start point
            {Array.from(patrolRouteData).map(([_, patrolRoute]) => {
              var index = 0;
              return (
                <Marker
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: randomColor(patrolRoute.length),
                    fillOpacity: 0.5,
                    scale: 10,
                    strokeColor: randomColor(patrolRoute.length),
                    strokeWeight: 0.7,
                  }}
                  position={{
                    lat: patrolRoute[index].location._lat,
                    lng: patrolRoute[index].location._long,
                  }}
                  label={{
                    text: "Start",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                />
              );
            })}
          </GoogleMap>
        </Grid>
      </Paper>
    </div>
  );
}
