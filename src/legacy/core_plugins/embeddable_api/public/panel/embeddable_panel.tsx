/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { EuiContextMenuPanelDescriptor, EuiPanel } from '@elastic/eui';
import classNames from 'classnames';
import React from 'react';
import { Subscription } from 'rxjs';
import {
  ContextMenuAction,
  ContextMenuPanel,
  buildEuiContextMenuPanels,
} from '../context_menu_actions';

import { Action, Container, Embeddable, CONTEXT_MENU_TRIGGER, ViewMode } from '..';

import { getEditPanelAction, RemovePanelAction } from './panel_header/panel_actions';
import { AddPanelAction } from './panel_header/panel_actions/add_panel/add_panel_action';
import { CustomizePanelTitleAction } from './panel_header/panel_actions/customize_title/customize_panel_action';
import { PanelHeader } from './panel_header/panel_header';
import { actionRegistry } from '../actions';
import { InspectPanelAction } from './panel_header/panel_actions/inspect_panel_action';

interface Props {
  embeddable: Embeddable<any, any>;
}

interface State {
  focusedPanelIndex?: string;
  viewMode: ViewMode;
  hidePanelTitles: boolean;
  closeContextMenu: boolean;
}

export class EmbeddablePanel extends React.Component<Props, State> {
  private embeddableRoot: React.RefObject<HTMLDivElement>;
  private subscription?: Subscription;
  private mounted: boolean = false;
  constructor(props: Props) {
    super(props);
    const viewMode = this.props.embeddable.parent
      ? this.props.embeddable.parent.getViewMode()
      : ViewMode.EDIT;
    const hidePanelTitles = this.props.embeddable.parent
      ? this.props.embeddable.parent.getHidePanelTitles()
      : false;

    this.state = {
      viewMode,
      hidePanelTitles,
      closeContextMenu: false,
    };

    this.embeddableRoot = React.createRef();
  }

  public componentWillMount() {
    this.mounted = true;
    const { parent } = this.props.embeddable;
    if (parent) {
      this.subscription = parent.getInput$().subscribe(() => {
        if (this.mounted && parent) {
          this.setState({
            viewMode: parent.getViewMode(),
            hidePanelTitles: parent.getHidePanelTitles(),
          });
        }
      });
    }
  }

  public componentWillUnmount() {
    this.mounted = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public onFocus = (focusedPanelIndex: string) => {
    this.setState({ focusedPanelIndex });
  };

  public onBlur = (blurredPanelIndex: string) => {
    if (this.state.focusedPanelIndex === blurredPanelIndex) {
      this.setState({ focusedPanelIndex: undefined });
    }
  };

  public render() {
    const viewOnlyMode = this.state.viewMode === ViewMode.VIEW;
    const classes = classNames('embPanel', {
      'embPanel--editing': !viewOnlyMode,
    });
    const title = this.props.embeddable.getTitle();
    return (
      <EuiPanel className={classes} data-test-subj="embeddablePanel" paddingSize="none">
        <PanelHeader
          getPanels={this.getPanels}
          hidePanelTitles={this.state.hidePanelTitles}
          isViewMode={viewOnlyMode}
          closeContextMenu={this.state.closeContextMenu}
          title={title}
        />
        <div className="embeddable-root panel-content" ref={this.embeddableRoot} />
      </EuiPanel>
    );
  }

  public componentDidMount() {
    this.props.embeddable.render(this.embeddableRoot.current);
  }

  private getPanels = async () => {
    let panels: EuiContextMenuPanelDescriptor[] = [];

    const actions = await actionRegistry.getActionsForTrigger(CONTEXT_MENU_TRIGGER, {
      embeddable: this.props.embeddable,
    });

    const contextMenuPanel = new ContextMenuPanel({
      title: 'Options',
      id: 'mainMenu',
    });

    const closeMyContextMenuPanel = () => {
      this.setState({ closeContextMenu: true }, () => {
        this.setState({ closeContextMenu: false });
      });
    };

    const allPanelActions = [
      new CustomizePanelTitleAction(),
      new AddPanelAction(),
      new InspectPanelAction(),
      new RemovePanelAction(),
    ];

    const promises = allPanelActions.map(async action => {
      if (
        await action.isCompatible({
          embeddable: this.props.embeddable,
        })
      ) {
        actions.push(action);
      }
    });

    await Promise.all(promises);

    const wrappedForContextMenu = actions.map((action: Action) => {
      return new ContextMenuAction<Embeddable, Container>(
        {
          id: action.id,
          displayName: action.getTitle({
            embeddable: this.props.embeddable,
          }),
          parentPanelId: 'mainMenu',
        },
        {
          priority: action.priority,
          icon: action.getIcon({
            embeddable: this.props.embeddable,
          }),
          onClick: ({ embeddable }) => {
            action.execute({ embeddable });
            closeMyContextMenuPanel();
          },
        }
      );
    });

    const contextMenuActions = [getEditPanelAction()].concat(wrappedForContextMenu);

    const sorted = contextMenuActions.sort((a, b) => {
      return b.priority - a.priority;
    });

    panels = buildEuiContextMenuPanels({
      contextMenuPanel,
      actions: sorted,
      embeddable: this.props.embeddable,
      container: this.props.embeddable.parent,
    });
    return panels;
  };
}
