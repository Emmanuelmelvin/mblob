import { Router, Route, Switch } from 'wouter'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Upload } from './pages/Upload'
import { Retrieve } from './pages/Retrieve'

export default function App() {
  return (
    <Router>
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/upload" component={Upload} />
          <Route path="/retrieve" component={Retrieve} />
          <Route>
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-black mb-2">404</h1>
              <p className="text-sm text-neutral-500">Page not found</p>
            </div>
          </Route>
        </Switch>
      </Layout>
    </Router>
  )
}
