import { Container as InversifyContainer } from 'inversify';
import type { Container as IContainer } from 'inversify';

class Container extends InversifyContainer { }

export type { IContainer };
export default Container;
