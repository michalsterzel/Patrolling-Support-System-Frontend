import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { Grid } from '@mui/material';
import { TextField } from '@mui/material';
import { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore'
import { auth } from "../firebase-config.js";
import ReplayIcon from '@mui/icons-material/Replay';

const columns = [
  { field: 'name', headerName: 'First name', width: 180 },
  { field: 'surname', headerName: 'Last name', width: 180 },
  { field: 'supervisor', headerName: 'Supervisor', width: 190 },
];


export function AddParticipantsForm({
  selectedRows,
  handleSelectedRowsChange,
  currentSelection = []
}) {

  const [rows, setRows] = useState([]);

  const [pageLoadSelection, setPageLoadSelection] = useState([]);
  const handleSelectionChange = (newSelection) => {
    setPageLoadSelection(newSelection);
    handleSelectedRowsChange(newSelection);
  };

  const getRowsFromFirestore = async () => {
    if (auth.currentUser) {
      const database = getFirestore();
      const q = query(collection(database, 'Users'));
      const querySnapshot = await getDocs(q);
      const fetchedRows = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const checked = currentSelection.includes(doc.id);
        fetchedRows.push({
          id: doc.id,
          surname: data.surname,
          name: data.name,
          supervisor: data.supervisor,
          checked: checked,
        });
      });
      setRows(fetchedRows);
    }
  }

  React.useEffect(() => {
    getRowsFromFirestore();
  }, []);

  React.useEffect(() => {
    const initialSelectedRows = rows
      .filter((row) => row.checked)
      .map((row) => row.id);
    setPageLoadSelection(initialSelectedRows);
    handleSelectedRowsChange(initialSelectedRows);
  }, [rows]);

  const [search, setSearch] = useState("");
  const onSearchChange = (event) => {
    setSearch(event.target.value);
    if (event.key === 'Enter') {
      handleSearchChange(event.target.value);
    }
  }

  const handleSearchChange = async (search) => {

    if (auth.currentUser) {
      const database = getFirestore();
      const q = query(collection(database, 'Users'), where("name", "==", search));
      const querySnapshot = await getDocs(q);
      const fetchedRows = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedRows.push({
          id: doc.id,
          surname: data.surname,
          name: data.name,
          supervisor: data.supervisor,
        });
      });
      setRows(fetchedRows);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <React.Fragment>
        <Grid container spacing={4} justify='center' alignItems='center'>
          <Grid item xs={12} sm={10} margin={10}>
            <TextField
              id="search"
              type="search"
              label="Search"
              fullWidth
              placeholder='Search participants'
              value={search}
              onChange={onSearchChange}
              onKeyDown={onSearchChange}
              InputProps={{
                endAdornment: (
                  <React.Fragment>
                    <IconButton onClick={() => getRowsFromFirestore()}>
                      <ReplayIcon />
                    </IconButton>
                    <IconButton onClick={() => handleSearchChange(search)}>
                      <SearchIcon />
                    </IconButton>
                  </React.Fragment>
                ),
              }}
            />
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                checkboxSelection
                onRowSelectionModelChange={handleSelectionChange}
                rowSelectionModel={pageLoadSelection}
              />
            </div>
          </Grid>
        </Grid>
      </React.Fragment>
    </Box>
  );
}