// eslint-disable-next-line import/no-extraneous-dependencies
import { isMiniApp } from 'universal-env';
import getDomNodeFromEvt from './events/getDomNodeFromEvt';
import baseEvents from './events/baseEvents';
import { handlesMap } from '../builtInComponents';
import callEvent from './events/callEvent';
import callSimpleEvent from './events/callSimpleEvent';
import callSingleEvent from './events/callSingleEvent';
import cache from '../utils/cache';

function getPageId(internal, pageId) {
  if (pageId) return pageId;
  let props;
  if (!isMiniApp) {
    props = internal.properties;
  } else {
    props = internal.props;
  }
  return props && props.r.pageId;
}

export default function() {
  const config = {};
  // Add get DOM Node from event method
  config.getDomNodeFromEvt = getDomNodeFromEvt;
  // Add call event method
  config.callEvent = callEvent;
  // Add call simple event method
  config.callSimpleEvent = callSimpleEvent;
  // Add call single event method
  config.callSingleEvent = callSingleEvent;
  // Add reactive event define which will bubble
  baseEvents.forEach(({ name, extra = null, eventName }) => {
    config[name] = function(evt) {
      const domNode = this.getDomNodeFromEvt(eventName, evt);
      const document = domNode.ownerDocument;
      if (document && document.__checkEvent(evt)) {
        this.callEvent(eventName, evt, extra, evt.currentTarget.dataset.privateNodeId); // Default Left button
      }
    };
  });
  // Add reactive event define which won't bubble
  handlesMap.simpleEvents.forEach(({ name, eventName }) => {
    config[name] = function(evt) {
      const nodeId = evt.currentTarget.dataset.privateNodeId;
      const targetNode = cache.getNode(nodeId);
      if (!targetNode) return;
      this.callSimpleEvent(eventName, evt, targetNode);
    };
  });

  // Add reactive event define which only trigger once
  handlesMap.singleEvents.forEach(({ name, eventName }) => {
    config[name] = function(evt) {
      this.callSingleEvent(eventName, evt);
    };
  });

  // Add reactive event define which only trigger once and need middleware
  handlesMap.functionalSingleEvents.forEach(({ name, eventName, middleware }) => {
    config[name] = function(evt) {
      const domNode = this.getDomNodeFromEvt(eventName, evt);
      if (!domNode) return;
      middleware.call(this, evt, domNode);
      this.callSingleEvent(eventName, evt);
    };
  });

  // Add reactive event define which complex
  handlesMap.complexEvents.forEach(({ name, eventName, middleware }) => {
    config[name] = function(evt) {
      const domNode = this.getDomNodeFromEvt(eventName, evt);
      if (!domNode) return;
      middleware.call(this, evt, domNode, evt.currentTarget.dataset.privateNodeId);
    };
  });
  return config;
}
