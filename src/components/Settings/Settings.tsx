import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import Header from '~/components/common/Header';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Portal from '~/components/common/Portal';
import Input, { Type } from '~/components/common/Input';
import Select from '~/components/common/Select';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { ExpandTreeState, ExpandTreeStateTitlesMap } from '~/components/common/JsonViewer/ExpandTreeState';
import { expandLevelOptions } from '~/components/common/JsonViewer/ExpandLevel';
import { ExtensionTheme, JsonViewerTheme } from '~/logic/SettingsContext/Theme';
import { ViewMode, viewModeOptions } from '~/logic/SettingsContext/ViewMode';
import useIsNarrowLayout from '~/logic/common/useIsNarrowLayout';
import SettingsCard from './SettingsCard';
import { SettingsTab, settingsTabs } from './SettingsTab';
import styles from './settings.scss';

interface IComponentProps {
  onClose: () => void,
}

const tabStepMap: Record<string, number> = {
  ArrowDown: 1,
  ArrowRight: 1,
  ArrowUp: -1,
  ArrowLeft: -1
};

const Settings = ({ onClose }: IComponentProps) => {
  const [activeTab, setActiveTab] = useState(SettingsTab.Preferences);
  const tabRefs = useRef<Partial<Record<SettingsTab, HTMLButtonElement>>>({});
  const isNarrowLayout = useIsNarrowLayout();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = tabStepMap[e.key];

    if (!step) return;

    e.preventDefault();
    e.stopPropagation();

    const nextIndex = (settingsTabs.indexOf(activeTab) + step + settingsTabs.length) % settingsTabs.length;
    const nextTab = settingsTabs[nextIndex];

    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const {
    preserveLog,
    setPreserveLog,
    showRequestUrl,
    setShowRequestUrl,
    showCorsBadge,
    setShowCorsBadge,
    showWebsocketBadge,
    setShowWebsocketBadge,
    expandTreeState,
    setExpandTreeState,
    expandLevel,
    setExpandLevel,
    expandedWebsocketMessagesState,
    setExpandedWebsocketMessagesState,
    extensionTheme,
    setExtensionTheme,
    jsonViewerTheme,
    setJsonViewerTheme,
    autoScroll,
    setAutoScroll,
    includeJsonRpcLogs,
    setIncludeJsonRpcLogs,
    includeWebsocketLogs,
    setIncludeWebsocketLogs,
    showWaterfallColumn,
    setShowWaterfallColumn,
    showStatusColumn,
    setShowStatusColumn,
    showSizeColumn,
    setShowSizeColumn,
    showTimeColumn,
    setShowTimeColumn,
    viewMode,
    setViewMode,
    resilientCapture,
    setResilientCapture,
  } = useSettingsContext();

  const handlePreserveLogChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreserveLog(e.target.checked);
  };

  const handleShowRequestUrlChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowRequestUrl(e.target.checked);
  };

  const handleShowCorsBadgeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowCorsBadge(e.target.checked);
  };

  const handleShowWebsocketBadgeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowWebsocketBadge(e.target.checked);
  };

  const handleAutoScrollChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setAutoScroll(e.target.checked);
  };

  const handleExpandTreeStateChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExpandTreeState(+e.target.value);
  };

  const handleExpandLevelChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExpandLevel(+e.target.value);
  };

  const handleExpandedWebsocketMessagesStateChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExpandedWebsocketMessagesState(+e.target.value);
  };

  const handleExtensionThemeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExtensionTheme(e.target.value as ExtensionTheme);
  };

  const handleJsonViewerThemeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setJsonViewerTheme(e.target.value as JsonViewerTheme);
  };

  const handleIncludeJsonRpcLogsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIncludeJsonRpcLogs(e.target.checked);
  };

  const handleIncludeWebsocketLogsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIncludeWebsocketLogs(e.target.checked);
  };

  const handleShowWaterfallColumnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowWaterfallColumn(e.target.checked);
  };

  const handleShowStatusColumnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowStatusColumn(e.target.checked);
  };

  const handleShowSizeColumnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowSizeColumn(e.target.checked);
  };

  const handleShowTimeColumnChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowTimeColumn(e.target.checked);
  };

  const handleViewModeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setViewMode(e.target.value as ViewMode);
  };

  const handleResilientCaptureChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setResilientCapture(e.target.checked);
  };

  const expandedTreeStateOptions = Object.keys(ExpandTreeStateTitlesMap).map((id) => ({
    key: +id,
    value: ExpandTreeStateTitlesMap[id]
  }));

  const extensionThemeOptions = Object.values(ExtensionTheme).map((key) => ({
    key,
    value: key
  }));

  const jsonViewerThemeOptions = Object.values(JsonViewerTheme).map((key) => ({
    key,
    value: key
  }));

  const columnsDescription = isNarrowLayout
    ? 'Method is always shown. The panel is too narrow to fit the others right now - '
      + 'they come back when you widen it.'
    : 'Method is always shown.';

  return (
    <Portal>
      <div className={ styles.settingsWrapper }>
        <Header>
          <strong>JSON-RPC Chrome Viewer Settings</strong>
          <Button
            className={ styles.closeButton }
            onClick={ onClose }
          >
            <Icon type={ IconType.Close } />
          </Button>
        </Header>
        <div className={ styles.settingsBody }>
          <div
            className={ styles.sidebar }
            role="tablist"
            aria-orientation="vertical"
            aria-label="Settings sections"
          >
            { settingsTabs.map((tab) => (
              <button
                key={ tab }
                type="button"
                role="tab"
                aria-selected={ tab === activeTab }
                tabIndex={ tab === activeTab ? 0 : -1 }
                ref={ (el) => {
                  tabRefs.current[tab] = el;
                } }
                className={ cn(styles.tabButton, {
                  [styles.isActive]: tab === activeTab
                }) }
                onClick={ () => setActiveTab(tab) }
                onKeyDown={ handleTabKeyDown }
              >
                { tab }
              </button>
            )) }
          </div>
          <div
            className={ styles.settingsContainer }
            role="tabpanel"
            aria-label={ activeTab }
          >
            <div className={ styles.settingsColumns }>
              { activeTab === SettingsTab.Preferences && (
                <>
                  <SettingsCard title="General">
                    <Input
                      name="preserveLog"
                      label="Preserve log"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ preserveLog }
                      onChange={ handlePreserveLogChange }
                    />
                    <Input
                      name="autoScroll"
                      label="Autoscroll to the latest request"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ autoScroll }
                      onChange={ handleAutoScrollChange }
                    />
                  </SettingsCard>
                  <SettingsCard
                    title="Filters"
                    description="Which kinds of traffic the panel records."
                  >
                    <Input
                      name="includeJsonRpcLogs"
                      label="Include JSON-RPC logs"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ includeJsonRpcLogs }
                      onChange={ handleIncludeJsonRpcLogsChange }
                    />
                    <Input
                      name="includeWebsocketLogs"
                      label="Include Websocket logs"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ includeWebsocketLogs }
                      onChange={ handleIncludeWebsocketLogsChange }
                    />
                  </SettingsCard>
                </>
              ) }
              { activeTab === SettingsTab.Appearance && (
                <>
                  <SettingsCard title="Layout">
                    <label
                      className={ styles.field }
                      htmlFor="settings-viewMode"
                    >
                      <span className={ styles.fieldLabel }>Request view</span>
                      <Select<ViewMode>
                        id="settings-viewMode"
                        name="viewMode"
                        className={ styles.fieldControl }
                        options={ viewModeOptions }
                        value={ isNarrowLayout ? ViewMode.Accordion : viewMode }
                        isDisabled={ isNarrowLayout }
                        onChange={ handleViewModeChange }
                      />
                      { isNarrowLayout && (
                        <span className={ styles.fieldHint }>
                          The panel is too narrow to show a request beside the list, so Accordion is in
                          use. Widen it - or undock DevTools - to choose again. Your saved choice is kept.
                        </span>
                      ) }
                    </label>
                    <label
                      className={ styles.field }
                      htmlFor="settings-extensionTheme"
                    >
                      <span className={ styles.fieldLabel }>Theme</span>
                      <Select<ExtensionTheme>
                        id="settings-extensionTheme"
                        name="extensionTheme"
                        className={ styles.fieldControl }
                        options={ extensionThemeOptions }
                        value={ extensionTheme }
                        onChange={ handleExtensionThemeChange }
                      />
                    </label>
                  </SettingsCard>
                  <SettingsCard title="Request row">
                    <Input
                      name="showRequestUrl"
                      label="Show url for each request"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ showRequestUrl }
                      onChange={ handleShowRequestUrlChange }
                    />
                    <div className={ styles.dependentRows }>
                      <Input
                        name="showCorsBadge"
                        label="CORS badge"
                        title={ showRequestUrl ? undefined : 'Requires "Show url for each request"' }
                        wrapperClassName={ styles.checkboxRow }
                        type={ Type.Checkbox }
                        checked={ showCorsBadge }
                        isDisabled={ !showRequestUrl }
                        onChange={ handleShowCorsBadgeChange }
                      />
                      <Input
                        name="showWebsocketBadge"
                        label="Websocket badge"
                        title={ showRequestUrl ? undefined : 'Requires "Show url for each request"' }
                        wrapperClassName={ styles.checkboxRow }
                        type={ Type.Checkbox }
                        checked={ showWebsocketBadge }
                        isDisabled={ !showRequestUrl }
                        onChange={ handleShowWebsocketBadgeChange }
                      />
                    </div>
                  </SettingsCard>
                  <SettingsCard
                    title="Columns"
                    description={ columnsDescription }
                  >
                    <Input
                      name="showWaterfallColumn"
                      label="Waterfall"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ showWaterfallColumn }
                      onChange={ handleShowWaterfallColumnChange }
                    />
                    <Input
                      name="showStatusColumn"
                      label="Status"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ showStatusColumn }
                      onChange={ handleShowStatusColumnChange }
                    />
                    <Input
                      name="showSizeColumn"
                      label="Size (B)"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ showSizeColumn }
                      onChange={ handleShowSizeColumnChange }
                    />
                    <Input
                      name="showTimeColumn"
                      label="Time (ms)"
                      wrapperClassName={ styles.checkboxRow }
                      type={ Type.Checkbox }
                      checked={ showTimeColumn }
                      onChange={ handleShowTimeColumnChange }
                    />
                  </SettingsCard>
                </>
              ) }
              { activeTab === SettingsTab.JsonViewer && (
                <>
                  <SettingsCard title="JSON tree">
                    <label
                      className={ styles.field }
                      htmlFor="settings-jsonViewerTheme"
                    >
                      <span className={ styles.fieldLabel }>Theme</span>
                      <Select<JsonViewerTheme>
                        id="settings-jsonViewerTheme"
                        name="jsonViewerTheme"
                        className={ styles.fieldControl }
                        options={ jsonViewerThemeOptions }
                        value={ jsonViewerTheme }
                        onChange={ handleJsonViewerThemeChange }
                      />
                    </label>
                    <label
                      className={ styles.field }
                      htmlFor="settings-expandedTreeState"
                    >
                      <span className={ styles.fieldLabel }>Open state</span>
                      <Select<ExpandTreeState>
                        id="settings-expandedTreeState"
                        name="expandedTreeState"
                        className={ styles.fieldControl }
                        options={ expandedTreeStateOptions }
                        value={ expandTreeState }
                        onChange={ handleExpandTreeStateChange }
                      />
                    </label>
                    { expandTreeState === ExpandTreeState.Expanded && (
                      <label
                        className={ cn(styles.field, styles.dependentRows) }
                        htmlFor="settings-expandLevel"
                      >
                        <span className={ styles.fieldLabel }>Expand level</span>
                        <Select<number>
                          id="settings-expandLevel"
                          name="expandLevel"
                          className={ styles.fieldControl }
                          options={ expandLevelOptions }
                          value={ expandLevel }
                          onChange={ handleExpandLevelChange }
                        />
                      </label>
                    ) }
                  </SettingsCard>
                  <SettingsCard title="Websocket messages">
                    <label
                      className={ styles.field }
                      htmlFor="settings-expandedWebsocketTreeState"
                    >
                      <span className={ styles.fieldLabel }>Open state</span>
                      <Select<ExpandTreeState>
                        id="settings-expandedWebsocketTreeState"
                        name="expandedWebsocketTreeState"
                        className={ styles.fieldControl }
                        options={ expandedTreeStateOptions }
                        value={ expandedWebsocketMessagesState }
                        onChange={ handleExpandedWebsocketMessagesStateChange }
                      />
                    </label>
                  </SettingsCard>
                </>
              ) }
              { activeTab === SettingsTab.Troubleshooting && (
                <SettingsCard title="Resilient capture">
                  <Input
                    name="resilientCapture"
                    label="Resilient capture (patch fetch in page)"
                    wrapperClassName={ styles.checkboxRow }
                    type={ Type.Checkbox }
                    checked={ resilientCapture }
                    onChange={ handleResilientCaptureChange }
                  />
                  <p className={ styles.hint }>
                    <strong>Turn this on if requests appear in the Network tab but not here.</strong> Another
                    DevTools extension patching <code>window.fetch</code> makes Chrome credit it as the
                    request&apos;s initiator, which stops this panel from being told about the request at all.{ ' ' }
                    <strong>React DevTools 7.0.1 does this</strong> - if it is installed, this is almost certainly why.
                  </p>
                  <p className={ styles.hint }>
                    This works around it by reading requests inside the page instead of relying on Chrome to
                    report them, and also shows each call while it is still in flight. Costs: this patches{ ' ' }
                    <code>window.fetch</code> on every page, so <code>fetch.toString()</code> no longer reads as
                    native and other DevTools extensions may stop seeing these requests. Only{ ' ' }
                    <code>fetch</code> is covered - not XHR - and a page that captured <code>fetch</code>{ ' ' }
                    before this loads is missed.
                  </p>
                </SettingsCard>
              ) }
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Settings;
