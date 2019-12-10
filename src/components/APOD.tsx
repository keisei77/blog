import React, { useState, useEffect } from 'react';
import Image from 'material-ui-image';
import APIKey from '../config/NASA';

interface APOD_OPTIONS {
  copyright: string;
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}

const APOD = () => {
  const [APOD_Info, setAPOD_Info] = useState<APOD_OPTIONS>({} as APOD_OPTIONS);
  useEffect(() => {
    fetch(`https://api.nasa.gov/planetary/apod?api_key=${APIKey}`).then(
      result => {
        result.json().then(val => {
          setAPOD_Info(val);
        });
      }
    );
  }, []);
  return APOD_Info.url ? (
    <div>
      <strong>{APOD_Info.title}</strong>
      <p>{APOD_Info.date}</p>
      <p>{APOD_Info.explanation}</p>
      <Image src={APOD_Info.url} />
    </div>
  ) : null;
};

export default APOD;

APOD.displayName = 'APOD';
