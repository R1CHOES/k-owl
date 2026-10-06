const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateFaviconUrl = (website) => {
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${website}&size=128`;
};

const clusteredAgencies = [
  { 
    name: "DOST-PAGASA", 
    description: "Philippine Atmospheric, Geophysical and Astronomical Services Administration", 
    cluster: "Scientific and Technological Service Institute",
    website: "https://bagong.pagasa.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&w=800&q=80",
    address: "Science Garden Complex, BIR Road, Brgy. Central, Quezon City"
  },
  { 
    name: "DOST-PHIVOLCS", 
    description: "Philippine Institute of Volcanology and Seismology", 
    cluster: "Scientific and Technological Service Institute",
    website: "https://www.phivolcs.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1621379464521-bb7cbbfb4c80?auto=format&fit=crop&w=800&q=80",
    address: "PHIVOLCS Building, C.P. Garcia Avenue, U.P. Campus, Diliman, Quezon City"
  },
  { 
    name: "DOST-SEI", 
    description: "Science Education Institute", 
    cluster: "Scientific and Technological Service Institute",
    website: "https://sei.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    address: "1st and 2nd Levels, Science Heritage Building, DOST Compound, General Santos Avenue, Bicutan, Taguig City"
  },
  { 
    name: "DOST-PSHS", 
    description: "Philippine Science High School", 
    cluster: "Scientific and Technological Service Institute",
    website: "https://www.pshs.edu.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
    address: "Agham Road, Diliman, Quezon City"
  },
  { 
    name: "DOST-STII", 
    description: "Science and Technology Information Institute", 
    cluster: "Scientific and Technological Service Institute",
    website: "https://stii.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    address: "DOST Complex, General Santos Avenue, Upper Bicutan, Taguig City"
  },
  { 
    name: "DOST-TAPI", 
    description: "Technology Application and Promotion Institute", 
    cluster: "Scientific and Technological Service Institute",
    website: "https://www.tapi.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    address: "TAPI Building, DOST Compound, Gen. Santos Avenue, Bicutan, Taguig City"
  },
  { 
    name: "DOST-PCIEERD", 
    description: "Philippine Council for Industry, Energy and Emerging Technology R&D", 
    cluster: "Sectoral Planning Council",
    website: "https://pcieerd.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    address: "4th and 5th Levels, Science Heritage Building, DOST Compound, Bicutan, Taguig City"
  },
  { 
    name: "DOST-PCHRD", 
    description: "Philippine Council for Health Research and Development", 
    cluster: "Sectoral Planning Council",
    website: "https://www.pchrd.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    address: "Saliksik Building, Sikap Street, DOST Main Compound, Gen. Santos Ave., Bicutan, Taguig City"
  },
  { 
    name: "DOST-PCAARRD", 
    description: "Philippine Council for Agriculture, Aquatic and Natural Resources R&D", 
    cluster: "Sectoral Planning Council",
    website: "https://www.pcaarrd.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80",
    address: "Paseo de Valmayor, Timugan, Economic Garden, Los Baños, Laguna"
  },
  { 
    name: "DOST-ASTI", 
    description: "Advanced Science and Technology Institute", 
    cluster: "Research and Development Institute",
    website: "https://asti.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    address: "ASTI Bldg., U.P. Technology Park Complex, C.P. Garcia Ave., Diliman, Quezon City"
  },
  { 
    name: "DOST-FNRI", 
    description: "Food and Nutrition Research Institute", 
    cluster: "Research and Development Institute",
    website: "https://www.fnri.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    address: "DOST Compound, Gen. Santos Avenue, Bicutan, Taguig City"
  },
  { 
    name: "DOST-FPRDI", 
    description: "Forest Product Research and Development Institute", 
    cluster: "Research and Development Institute",
    website: "https://fprdi.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    address: "Narra Road, Forestry Campus, College, Los Baños, Laguna"
  },
  { 
    name: "DOST-ITDI", 
    description: "Industrial Technology Development Institute", 
    cluster: "Research and Development Institute",
    website: "https://itdi.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80",
    address: "DOST Compound, General Santos Avenue, Bicutan, Taguig City"
  },
  { 
    name: "DOST-MIRDC", 
    description: "Metal Industry Research and Development Center", 
    cluster: "Research and Development Institute",
    website: "https://mirdc.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1565893309191-44eb08688432?auto=format&fit=crop&w=800&q=80",
    address: "Gen. Santos Ave., DOST Compound, Bicutan, Taguig City"
  },
  { 
    name: "DOST-PNRI", 
    description: "Philippine Nuclear Research Institute", 
    cluster: "Research and Development Institute",
    website: "https://pnri.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1574621100236-d26be7ec05a1?auto=format&fit=crop&w=800&q=80",
    address: "Commonwealth Avenue, Diliman, Quezon City"
  },
  { 
    name: "DOST-PTRI", 
    description: "Philippine Textile Research Institute", 
    cluster: "Research and Development Institute",
    website: "https://ptri.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1528221803734-6dbcc26d0df0?auto=format&fit=crop&w=800&q=80",
    address: "General Santos Avenue, Bicutan, Taguig City"
  },
  { 
    name: "DOST-NAST", 
    description: "National Academy of Science and Technology", 
    cluster: "Advisory Body",
    website: "https://nast.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&w=800&q=80",
    address: "3rd Level, Science Heritage Building, DOST Complex, Bicutan, Taguig City"
  },
  { 
    name: "DOST-NRCP", 
    description: "National Research Council of the Philippines", 
    cluster: "Advisory Body",
    website: "https://nrcp.dost.gov.ph/",
    bannerUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80",
    address: "Gen. Santos Ave., DOST Compound, Bicutan, Taguig City"
  }
];

async function main() {
  console.log('Seeding Clustered DOST Agencies with Official Logos...');
  for (const agency of clusteredAgencies) {
    agency.logoUrl = generateFaviconUrl(agency.website);
    await prisma.agency.upsert({
      where: { name: agency.name },
      update: { 
        description: agency.description, 
        cluster: agency.cluster,
        website: agency.website,
        logoUrl: agency.logoUrl,
        bannerUrl: agency.bannerUrl,
        address: agency.address
      },
      create: agency,
    });
  }
  console.log('✅ DOST Agencies successfully updated with official logos!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
