import React, { useEffect, useState } from "react";
import { Select, Spin } from "antd";
import "antd/dist/reset.css";
import "./App.css";

const { Option } = Select;

function App() {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedSubdistrictName, setSelectedSubdistrictName] = useState("");
  const [selectedVillageName, setSelectedVillageName] = useState("");

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Load states
  useEffect(() => {
    fetch("http://localhost:3000/states")
      .then(res => res.json())
      .then(data => setStates(data));
  }, []);

  // STATE CHANGE
  const handleStateChange = (value, option) => {
    setLoading(true);
    setSelectedStateName(option.children);
    setDistricts([]);
    setSubdistricts([]);
    setVillages([]);

    fetch(`http://localhost:3000/districts/${value}`)
      .then(res => res.json())
      .then(data => {
        setDistricts(data);
        setLoading(false);
      });
  };

  // DISTRICT CHANGE
  const handleDistrictChange = (value, option) => {
    setLoading(true);
    setSelectedDistrictName(option.children);
    setSubdistricts([]);
    setVillages([]);

    fetch(`http://localhost:3000/subdistricts/${value}`)
      .then(res => res.json())
      .then(data => {
        setSubdistricts(data);
        setLoading(false);
      });
  };

  // SUBDISTRICT CHANGE
  const handleSubdistrictChange = (value, option) => {
    setLoading(true);
    setSelectedSubdistrictName(option.children);
    setVillages([]);

    fetch(`http://localhost:3000/villages/${value}`)
      .then(res => res.json())
      .then(data => {
        setVillages(data);
        setLoading(false);
      });
  };

  // VILLAGE CHANGE
  const handleVillageChange = (value, option) => {
    setSelectedVillageName(option.children);
  };

  // SEARCH API
  const handleSearch = (value) => {
    if (value.length < 2) return;

    fetch(`http://localhost:3000/search?q=${value}`)
      .then(res => res.json())
      .then(data => setSearchResults(data));
  };

  return (
    <div className="container">
      <div className="card">
        <div className="title">India Location Selector 🇮🇳</div>

        {/* SEARCH */}
        <Select
          showSearch
          placeholder="Search village..."
          style={{ width: "100%", marginBottom: 15 }}
          onSearch={handleSearch}
          filterOption={false}
        >
          {searchResults.map(v => (
            <Option key={v.village_id} value={v.village}>
              {v.village}
            </Option>
          ))}
        </Select>

        <Spin spinning={loading}>

          {/* STATE */}
          <Select
            style={{ width: "100%", marginBottom: 15 }}
            placeholder="Select State"
            onChange={handleStateChange}
          >
            {states.map(s => (
              <Option key={s.state_id} value={s.state_id}>
                {s.state}
              </Option>
            ))}
          </Select>

          {/* DISTRICT */}
          {districts.length > 0 && (
            <Select
              style={{ width: "100%", marginBottom: 15 }}
              placeholder="Select District"
              onChange={handleDistrictChange}
            >
              {districts.map(d => (
                <Option key={d.district_id} value={d.district_id}>
                  {d.district}
                </Option>
              ))}
            </Select>
          )}

          {/* SUBDISTRICT */}
          {subdistricts.length > 0 && (
            <Select
              style={{ width: "100%", marginBottom: 15 }}
              placeholder="Select Subdistrict"
              onChange={handleSubdistrictChange}
            >
              {subdistricts.map(sd => (
                <Option key={sd.subdistrict_id} value={sd.subdistrict_id}>
                  {sd.subdistrict}
                </Option>
              ))}
            </Select>
          )}

          {/* VILLAGE */}
          {villages.length > 0 && (
            <Select
              style={{ width: "100%" }}
              placeholder="Select Village"
              onChange={handleVillageChange}
            >
              {villages.map(v => (
                <Option key={v.village_id} value={v.village_id}>
                  {v.village}
                </Option>
              ))}
            </Select>
          )}

        </Spin>

        {/* FINAL OUTPUT */}
        {selectedVillageName && (
          <div style={{ marginTop: 20, fontWeight: "bold" }}>
            📍 {selectedVillageName}, {selectedSubdistrictName},{" "}
            {selectedDistrictName}, {selectedStateName}, India
          </div>
        )}

      </div>
    </div>
  );
}

export default App;