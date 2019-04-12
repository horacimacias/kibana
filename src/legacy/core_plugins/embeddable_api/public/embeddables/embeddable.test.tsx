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

jest.mock('ui/metadata', () => ({
  metadata: {
    branch: 'my-metadata-branch',
    version: 'my-metadata-version',
  },
}));

import { HelloWorldEmbeddable } from '../__test__/index';

test('Embeddable calls input subscribers when changed', async done => {
  const hello = new HelloWorldEmbeddable({ id: '123', firstName: 'Sue' });

  const { unsubscribe } = hello.getInput$().subscribe(changes => {
    expect(changes).toEqual({ nameTitle: 'Dr.' });
    done();
    unsubscribe();
  });

  hello.graduateWithPhd();
});
