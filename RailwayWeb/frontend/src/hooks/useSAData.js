import { useState, useEffect, useCallback } from "react";
import { saDataService } from "../services/saDataService";
import { ALL_STAFF, UNIFIED_96_STATIONS } from "../utils/saConstants";

export function useSAData() {
  const [staff, setStaff] = useState([]);
  const [stations, setStations] = useState([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const fetchLiveDatabaseData = useCallback(async () => {
    setIsLoadingLive(true);
    try {
      const fetchedUsers = await saDataService.fetchUsers();
      setStaff(fetchedUsers);

      const fetchedStations = await saDataService.fetchStations(fetchedUsers);
      setStations(fetchedStations);
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveDatabaseData();
    const interval = setInterval(() => {
      fetchLiveDatabaseData();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchLiveDatabaseData]);

  const addStation = async (newStation) => {
    // Optimistic UI update
    setStations(prev => [newStation, ...prev]);
    try {
      await saDataService.addStation(newStation);
      alert("Station added successfully!");
      fetchLiveDatabaseData();
    } catch (err) {
      alert("Failed to add station: " + (err.message || err));
      fetchLiveDatabaseData();
    }
  };

  const saveUser = async (modalData, mode) => {
    const localItem = {
      id: modalData.id,
      name: modalData.name,
      role: modalData.role,
      station: modalData.station || "—",
      ti: modalData.ti || "—",
      cat: modalData.cat || modalData.category || "A",
      risk: modalData.risk || (modalData.cat === "D" ? "High" : modalData.cat === "C" ? "Medium" : "Low"),
      score: modalData.score !== undefined ? modalData.score : null,
      contact: modalData.contact || "—",
      lastDate: modalData.lastDate || "—",
      status: modalData.status || (mode === "add" ? "Pending First Assessment" : "Approved"),
      email: modalData.email || "—",
      pfNumber: modalData.pfNumber || "—",
      division: modalData.division || "Nagpur",
      zone: modalData.zone || "Central Railway",
      reportingSm: modalData.reportingSm || "—",
      workLocation: modalData.workLocation || "—",
      shift: modalData.shift || "—",
      jurisdiction: modalData.jurisdiction || "—",
      linkedStations: modalData.linkedStations || "",
      reportingAom: "—"
    };

    // Optimistic UI update
    if (mode === "add") {
      setStaff(p => [...p, localItem]);
    } else {
      setStaff(p => p.map(s => s.id === localItem.id ? localItem : s));
    }

    try {
      await saDataService.saveUser(modalData, mode);
      alert(`${mode === "add" ? "User created" : "User updated"} successfully!`);
      fetchLiveDatabaseData();
      return true;
    } catch (err) {
      alert("Failed to save user: " + (err.message || err));
      fetchLiveDatabaseData();
      return false;
    }
  };

  const removeUser = async (id) => {
    // Optimistic UI update
    setStaff(p => p.filter(s => s.id !== id));
    try {
      await saDataService.removeUser(id);
      alert("User removed successfully!");
      fetchLiveDatabaseData();
    } catch (err) {
      alert("Failed to remove user: " + (err.message || err));
      fetchLiveDatabaseData();
    }
  };

  const updateStation = async (updatedStation) => {
    try {
      await saDataService.saveStation(updatedStation, "edit");
      alert("Station updated successfully!");
      fetchLiveDatabaseData();
    } catch (err) {
      alert("Failed to update station: " + (err.message || err));
      fetchLiveDatabaseData();
    }
  };

  const deleteStation = async (stationId, stationName) => {
    try {
      const res = await saDataService.deleteStation(stationId, stationName);
      if (res && res.success) {
        alert("Station deleted successfully!");
        fetchLiveDatabaseData();
        return true;
      } else {
        alert("Failed to delete station: " + (res?.error || "Unknown error"));
        return false;
      }
    } catch (err) {
      alert("Failed to delete station: " + (err.message || err));
      fetchLiveDatabaseData();
      return false;
    }
  };

  return {
    staff,
    stations,
    isLoadingLive,
    addStation,
    updateStation,
    deleteStation,
    saveUser,
    removeUser
  };
}
