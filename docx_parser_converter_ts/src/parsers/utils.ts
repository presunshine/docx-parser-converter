/**
 * Parser utilities.
 *
 * Matches Python: parsers/utils.py
 */

import { NSMAP } from '../core/constants';

const W_NS = NSMAP.w;

/**
 * Get attribute value from element with w: namespace.
 *
 * @param element - XML element
 * @param name - Attribute name (without namespace)
 * @returns Attribute value or null
 */
export function getAttribute(element: Element, name: string): string | null {
  // Try with full namespace
  let value = element.getAttributeNS(W_NS, name);
  if (value) {
    return value;
  }

  // Try with w: prefix
  value = element.getAttribute(`w:${name}`);
  if (value) {
    return value;
  }

  // Try without namespace
  value = element.getAttribute(name);
  return value || null;
}

/**
 * Get attribute value from element with any namespace.
 *
 * @param element - XML element
 * @param name - Attribute name
 * @returns Attribute value or null
 */
export function getAttributeAnyNs(element: Element, name: string): string | null {
  // Try all attributes
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.localName === name || attr.name === name || attr.name.endsWith(`:${name}`)) {
      return attr.value;
    }
  }
  return null;
}

/**
 * Get integer attribute value.
 *
 * @param element - XML element
 * @param name - Attribute name
 * @returns Integer value or null
 */
export function getIntAttribute(element: Element, name: string): number | null {
  const value = getAttribute(element, name);
  if (value === null) {
    return null;
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Get boolean attribute value (handles "1", "true", "on" as true).
 *
 * @param element - XML element
 * @param name - Attribute name
 * @returns Boolean value or null
 */
export function getBoolAttribute(element: Element, name: string): boolean | null {
  const value = getAttribute(element, name);
  if (value === null) {
    return null;
  }
  return value === '1' || value === 'true' || value === 'on';
}

/**
 * Parse toggle element (presence = true, value "0" or "false" = false).
 *
 * @param element - XML element
 * @returns True if present, false if explicitly false, null otherwise
 */
export function parseToggle(element: Element | null): boolean | null {
  if (!element) {
    return null;
  }
  const val = getAttribute(element, 'val');
  if (val === null) {
    return true; // Element present without val = true
  }
  return val !== '0' && val !== 'false';
}

/**
 * Find child element by local name.
 *
 * @param parent - Parent element
 * @param localName - Element local name (without namespace)
 * @returns Child element or null
 */
export function findChild(parent: Element, localName: string): Element | null {
  const children = parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) {
      const elem = child as Element;
      if (elem.localName === localName || elem.tagName === `w:${localName}`) {
        return elem;
      }
    }
  }
  return null;
}

/**
 * Find all children by local name.
 *
 * @param parent - Parent element
 * @param localName - Element local name (without namespace)
 * @returns Array of child elements
 */
export function findAllChildren(parent: Element, localName: string): Element[] {
  const result: Element[] = [];
  const children = parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) {
      const elem = child as Element;
      if (elem.localName === localName || elem.tagName === `w:${localName}`) {
        result.push(elem);
      }
    }
  }
  return result;
}

/**
 * Get text content of an element.
 *
 * @param element - XML element
 * @returns Text content or null
 */
export function getTextContent(element: Element | null): string | null {
  if (!element) {
    return null;
  }
  return element.textContent || null;
}

/**
 * Check if element has a child with given local name.
 *
 * @param parent - Parent element
 * @param localName - Element local name
 * @returns True if child exists
 */
export function hasChild(parent: Element, localName: string): boolean {
  return findChild(parent, localName) !== null;
}

/**
 * Get local name of an element.
 *
 * @param element - XML element
 * @returns Local name
 */
export function getLocalName(element: Element): string {
  return element.localName || element.tagName.split(':').pop() || element.tagName;
}

/**
 * Iterate over all child elements.
 *
 * @param parent - Parent element
 * @returns Generator of child elements
 */
export function* iterChildren(parent: Element): Generator<Element> {
  const children = parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === 1) {
      yield child as Element;
    }
  }
}

/**
 * Get value attribute from child element.
 *
 * @param parent - Parent element
 * @param childName - Child element name
 * @returns Value attribute or null
 */
export function getChildValue(parent: Element, childName: string): string | null {
  const child = findChild(parent, childName);
  if (!child) {
    return null;
  }
  return getAttribute(child, 'val');
}

/**
 * Get integer value attribute from child element.
 *
 * @param parent - Parent element
 * @param childName - Child element name
 * @returns Integer value or null
 */
export function getChildIntValue(parent: Element, childName: string): number | null {
  const value = getChildValue(parent, childName);
  if (value === null) {
    return null;
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

/**
 * Get toggle value from child element.
 *
 * @param parent - Parent element
 * @param childName - Child element name
 * @returns Boolean value or null
 */
export function getChildToggle(parent: Element, childName: string): boolean | null {
  const child = findChild(parent, childName);
  return parseToggle(child);
}
