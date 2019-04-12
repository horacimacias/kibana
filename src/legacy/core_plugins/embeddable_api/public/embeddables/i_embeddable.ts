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

export interface IEmbeddable<I, O> {
  /**
   * Is this embeddable an instance of a Container class, can it contain
   * nested embeddables?
   **/
  readonly isContainer: boolean;

  /**
   * If this embeddable is nested inside a container, this will contain
   * a reference to its parent.
   **/
  readonly parent?: Container;

  /**
   * The type of embeddable, this is what will be used to take a serialized
   * embeddable and find the correct factory for which to create an instance of it.
   **/
  readonly type: string;

  /**
   * A unique identifier for this embeddable. Mainly only used by containers to map their
   * Panel States to a child embeddable instance.
   **/
  readonly id: string;

  /**
   * Get the input used to instantiate this embeddable. The input is a serialized representation of
   * this embeddable instance and can be used to clone or re-instantiate it. Input state:
   * - Can be updated externally
   * - Can change multiple times for a single embeddable instance.
   * Examples: title, pie slice colors, custom search columns and sort order.
   **/
  getInput(): Readonly<I>;

  /**
   * Output state is:
   * - State that should not change once the embeddable is instantiated, or
   *  - State that is derived from the input state, or
   * - State that only the embeddable instance itself knows about, or the factory.
   * Examples: editUrl, title taken from a saved object, if your input state was first name and
   *   last name, your output state could be greeting.
   **/
  getOutput(): Readonly<O>;

  /**
   * Get notified when either output or input state changes.
   * TODO: use RxJs observables.
   */
  // subscribeToChanges(
  //   listener: (changes: { input?: Partial<I>; output?: Partial<O> }) => void
  // ): () => void;
}
