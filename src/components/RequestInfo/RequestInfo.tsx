import React from 'react';
import { Resizable } from 're-resizable';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import Button from '../common/Button';
import Header from '../common/Header';
import styles from './requestInfo.scss';

const minRequestInfoHeight = 100;

const RequestInfo = () => {
  const { clearSelection } = useRequestContext();

  return (
    <Resizable
      enable={ {
        top: false,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false
      } }
      className={ styles.requestInfoWrapper }
      minHeight={ minRequestInfoHeight }
      maxHeight="50%"
      defaultSize={ {
        width: '100%',
        height: 'auto'
      } }
    >
      <Header className={ styles.header }>
        <span>Request</span>
        <Button
          text="✕"
          onClick={ clearSelection }
        />
      </Header>
      <div className={ styles.requestInfoContainer }>
        <div>TreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTreeTree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
        <div>Tree</div>
      </div>
    </Resizable>
  );
};

export default RequestInfo;
