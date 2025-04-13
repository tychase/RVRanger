import { Link } from "wouter";
import {
  Tablet,
  Sun,
  Wifi,
  Video,
  ServerCrash,
  Snowflake,
  ArrowRight
} from "lucide-react";

const TechnologySection = () => {
  const techFeatures = [
    {
      icon: <Tablet className="text-primary text-xl" />,
      title: "Smart Control Systems",
      description: "Manage your entire RV from a tablet or smartphone. Control lighting, climate, entertainment systems, and monitor tank levels remotely."
    },
    {
      icon: <Sun className="text-primary text-xl" />,
      title: "Solar Technology",
      description: "Advanced solar systems with high-capacity lithium batteries allow for extended off-grid adventures without sacrificing comfort."
    },
    {
      icon: <Wifi className="text-primary text-xl" />,
      title: "Connectivity Solutions",
      description: "Stay connected with built-in WiFi boosters, satellite internet options, and cellular signal enhancers designed for remote travel."
    },
    {
      icon: <Video className="text-primary text-xl" />,
      title: "360° Camera Systems",
      description: "Navigate with confidence using multi-camera setups that eliminate blind spots and assist with parking and highway driving."
    },
    {
      icon: <ServerCrash className="text-primary text-xl" />,
      title: "Advanced Safety Features",
      description: "From collision avoidance systems to adaptive cruise control, modern RVs include automotive safety features for peace of mind."
    },
    {
      icon: <Snowflake className="text-primary text-xl" />,
      title: "Climate Control",
      description: "Multi-zone climate systems with heated floors and advanced insulation keep you comfortable in any weather condition."
    }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-4">Smart Technology & Innovation</h2>
          <p className="text-neutral-600 max-w-3xl mx-auto">
            Today's luxury RVs feature cutting-edge technology for comfort, convenience, and safety. Explore the latest innovations in recreational vehicles.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {techFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">{feature.title}</h3>
              <p className="text-neutral-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/browse">
            <a className="inline-flex items-center text-primary font-medium hover:text-primary-light">
              Explore All Technology Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
