import React from 'react';
import 'reflect-metadata';
import ReactDOM from 'react-dom/client';
import Application from '~/components/Application';
import { registerFonts } from '~/logic/common/fonts';
import './index.scss';

registerFonts();

ReactDOM.createRoot(document.getElementById('application')).render(<Application />);
