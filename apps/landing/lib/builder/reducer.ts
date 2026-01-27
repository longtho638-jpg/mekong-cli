import { v4 as uuidv4 } from 'uuid';
import { BuilderAction, BuilderState, COMPONENT_DEFINITIONS, LandingComponent } from './types';

export const initialState: BuilderState = {
  components: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,
  device: 'desktop',
  metadata: {
    title: 'Untitled Page',
    description: '',
    slug: '',
    ogImage: '',
  }
};

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  // Helper to manage history
  const withHistory = (newState: Partial<BuilderState>) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    const newComponents = newState.components || state.components;

    // Only push to history if components changed
    if (newState.components && newState.components !== state.components) {
        newHistory.push(newComponents);
    }

    return {
      ...state,
      ...newState,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  };

  switch (action.type) {
    case 'ADD_COMPONENT': {
      const def = COMPONENT_DEFINITIONS[action.payload.type];
      const newComponent: LandingComponent = {
        id: uuidv4(),
        type: action.payload.type,
        props: def.properties.reduce((acc, prop) => {
          acc[prop.name] = prop.defaultValue;
          return acc;
        }, {} as Record<string, any>),
      };

      const newComponents = [...state.components];
      if (typeof action.payload.index === 'number') {
        newComponents.splice(action.payload.index, 0, newComponent);
      } else {
        newComponents.push(newComponent);
      }

      return withHistory({
        components: newComponents,
        selectedId: newComponent.id,
      });
    }

    case 'REMOVE_COMPONENT': {
      const newComponents = state.components.filter(c => c.id !== action.payload.id);
      return withHistory({
        components: newComponents,
        selectedId: state.selectedId === action.payload.id ? null : state.selectedId,
      });
    }

    case 'UPDATE_COMPONENT': {
      const newComponents = state.components.map(c =>
        c.id === action.payload.id
          ? { ...c, props: { ...c.props, ...action.payload.props } }
          : c
      );
      return withHistory({ components: newComponents });
    }

    case 'SELECT_COMPONENT': {
      return {
        ...state,
        selectedId: action.payload.id,
      };
    }

    case 'MOVE_COMPONENT': {
      const { activeId, overId } = action.payload;
      const oldIndex = state.components.findIndex(c => c.id === activeId);
      const newIndex = state.components.findIndex(c => c.id === overId);

      if (oldIndex === -1 || newIndex === -1) return state;

      const newComponents = [...state.components];
      const [movedItem] = newComponents.splice(oldIndex, 1);
      newComponents.splice(newIndex, 0, movedItem);

      return withHistory({ components: newComponents });
    }

    case 'SET_DEVICE': {
      return {
        ...state,
        device: action.payload.device,
      };
    }

    case 'UPDATE_METADATA': {
      return withHistory({
        metadata: { ...state.metadata, ...action.payload },
      });
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        components: state.history[newIndex],
        historyIndex: newIndex,
        selectedId: null, // Deselect on undo to avoid confusion
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        components: state.history[newIndex],
        historyIndex: newIndex,
        selectedId: null,
      };
    }

    case 'LOAD_TEMPLATE': {
      return withHistory({
        components: action.payload.components,
        selectedId: null,
      });
    }

    default:
      return state;
  }
}
