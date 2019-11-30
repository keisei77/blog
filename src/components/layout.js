import React from 'react';
import Header from './header';

class Layout extends React.Component {
  render() {
    const { title, children } = this.props;

    return (
      <div>
        <header>
          <Header title={title} />
        </header>
        <main
          style={{
            marginLeft: `auto`,
            marginRight: `auto`,
            padding: '0 1rem',
          }}
        >
          {children}
        </main>
        <footer
          style={{
            marginLeft: `auto`,
            marginRight: `auto`,
            padding: '0 1rem',
          }}
        >
          © {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.org">Gatsby</a>
        </footer>
      </div>
    );
  }
}

export default Layout;
